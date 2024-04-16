const AWS = require('aws-sdk');
const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const BUCKET = 'education0433123';
const s3 = new AWS.S3();
const client = new DynamoDBClient();

function extractFile(event) {
  const contentType = event.headers['Content-Type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    throw new Error('Content-Type header is missing or incorrect in the request.');
  }

  const boundary = contentType.split(';')[1].split('=')[1];

  const body = Buffer.from(event.body, 'base64').toString('binary');

  const parts = body.split(`--${boundary}`);

  const formData = {};

  for (let part of parts) {
    part = part.trim();
    if (part.length === 0) continue;
    const [header, ...contentParts] = part.split('\r\n\r\n');
    const content = contentParts.join('\r\n\r\n').trim();
    const [, name] = header.match(/name="(.+?)"/) || [];
    if (!name) continue;
    formData[name] = content;
  }

  console.log('FormData:', formData);

  const { file: { filename, data } = {}, degree } = formData;

  console.log('Filename:', filename);
  console.log('Degree:', degree);

  if (!filename || !data || !degree) {
    throw new Error('Invalid or missing file name, data, or degree field in the multipart request.');
  }

  return {
    filename,
    data: Buffer.from(data, 'binary'),
    degree
  };
}

module.exports.createEducation = async (event) => {
  try {
    console.log('Event Body:', event.body);
    const { filename, data, degree } = extractFile(event);

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
        degree: { S: degree }, // Saving the degree field
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
