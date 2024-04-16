const AWS = require('aws-sdk');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const BUCKET = 'education0433123';
const s3 = new AWS.S3();
const client = new DynamoDBClient();

function extractFileAndDegree(event) {
  const body = Buffer.from(event.body, 'base64').toString();
  const boundary = event.headers['Content-Type'].split('boundary=')[1];
  const parts = body.split(`--${boundary}`);

  const filePart = parts.find(part => part.includes('filename='));
  const degreePart = parts.find(part => part.includes('name="degree"'));

  if (!filePart || !degreePart) {
    throw new Error('Invalid multipart request. File or degree field not found.');
  }

  const filenameMatch = filePart.match(/filename="(.+?)"/);
  const degreeMatch = degreePart.match(/\r\n\r\n(.+?)\r\n--/);

  if (!filenameMatch || !degreeMatch) {
    throw new Error('Invalid file name or degree field.');
  }

  const file = filenameMatch[1];
  const degree = degreeMatch[1];

  return { file, degree };
}

module.exports.createEducation = async (event) => {
  try {
    const { file, degree } = extractFileAndDegree(event);

    const data = Buffer.from(event.body, 'base64');

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
        degree: { S: degree }, // Assuming degree is a string
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
