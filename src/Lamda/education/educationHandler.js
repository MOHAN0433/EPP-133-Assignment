const AWS = require('aws-sdk');
const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
 
const BUCKET = 'education0433123';
const s3 = new AWS.S3();
const client = new DynamoDBClient();
 
function extractFileAndFields(event) {
  const contentType = event.headers['Content-Type'];
  if (!contentType) {
    throw new Error('Content-Type header is missing in the request.');
  }
 
  const boundary = parseMultipart.getBoundary(contentType);
  if (!boundary) {
    throw new Error(
      'Unable to determine the boundary from the Content-Type header.'
    );
  }
 
  const parts = parseMultipart.Parse(
    Buffer.from(event.body, 'base64'),
    boundary
  );
 
  if (!parts || parts.length === 0) {
    throw new Error('No parts found in the multipart request.');
  }
 
  let filename, data, degree;
  for (const part of parts) {
    const { name, filename: partFilename, data: partData } = part;
    if (name === 'file') {
      filename = partFilename;
      data = partData;
    } else if (name === 'degree') {
      degree = partData.toString('utf-8');
    }
  }
 
  if (!filename || !data) {
    throw new Error(
      'Invalid or missing file name or data in the multipart request.'
    );
  }
 
  return {
    filename,
    data,
    degree,
  };
}
 
module.exports.createEducation = async (event) => {
  try {
    const { filename, data, degree } = extractFileAndFields(event);
 
    // Upload file to S3
    await s3.putObject({
      Bucket: BUCKET,
      Key: filename,
      Body: data,
    }).promise();
 
    // Construct S3 object URL
    const s3ObjectUrl = `https://${BUCKET}.s3.amazonaws.com/${filename}`;
 
    // Save S3 object URL and degree in DynamoDB
    await client.send(new PutItemCommand({
      TableName: process.env.EDUCATION_TABLE,
      Item: {
        educationId: { N: Date.now().toString() }, // Assuming educationId is a number
        link: { S: s3ObjectUrl },
        degree: { S: degree },
        createdAt: { S: moment().format("YYYY-MM-DD HH:mm:ss") }
      }
    }));
 
    return {
      statusCode: 200,
      body: JSON.stringify({
        link: s3ObjectUrl,
      }),
    };
  } catch (err) {
    console.log('error-----', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
