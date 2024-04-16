const AWS = require('aws-sdk');
const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const BUCKET = 'education0433123';
const s3 = new AWS.S3();
const client = new DynamoDBClient();

function extractFileAndDegree(event) {
  const contentType = event.headers['Content-Type'];
  if (!contentType) {
    throw new Error('Content-Type header is missing in the request.');
  }

  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    throw new Error('Unable to determine the boundary from the Content-Type header.');
  }

  const parts = parseMultipart.Parse(
    Buffer.from(event.body, 'base64'),
    boundary
  );

  const filePart = parts.find(part => part.filename);
  const degreePart = parts.find(part => part.fieldName === 'degree');

  if (!filePart) {
    throw new Error('File part not found in the multipart request.');
  }

  if (!degreePart || !degreePart.data) {
    throw new Error('Degree field not found in the multipart request.');
  }

  return {
    file: filePart.filename,
    data: filePart.data,
    degree: degreePart.data.toString() // Convert degree data to string
  };
}

module.exports.createEducation = async (event) => {
  try {
    const { file, data, degree } = extractFileAndDegree(event);

    // Upload file to S3
    await s3.putObject({
      Bucket: BUCKET,
      Key: file,
      Body: data,
    }).promise();

    // Construct S3 object URL
    const s3ObjectUrl = `https://${BUCKET}.s3.amazonaws.com/${file}`;

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
