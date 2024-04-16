const AWS = require('aws-sdk');
const parseMultipart = require('parse-multipart');

const BUCKET = 'education0433123'; // Change the bucket name to match the one defined in your serverless configuration
const DYNAMODB_TABLE = 'EDUCATION_TABLE'; // Assuming the name of your DynamoDB table

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

function extractFile(event) {
  const contentType = event.headers['Content-Type'];
  if (!contentType) {
    throw new Error('Content-Type header is missing in the request.');
  }

  //boundary
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
  console.log('--------parts', parts);

  if (!parts || parts.length === 0) {
    throw new Error('No parts found in the multipart request.');
  }

  const [{ filename, data }] = parts;

  if (!filename || !data) {
    throw new Error(
      'Invalid or missing file name or data in the multipart request1..'
    );
  }

  return {
    filename,
    data,
  };
}

module.exports.createEducation = async (event) => {
  try {
    const { filename, data } = extractFile(event);
    console.log('---------data', data);
    // Upload file to S3
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: filename,
        Body: data,
      })
      .promise();

    // Save filename to DynamoDB table
    await dynamoDB
      .put({
        TableName: DYNAMODB_TABLE,
        Item: {
          educationId: event.body.educationId,
          filename: filename,
          createdAt: Date.now(), // Optionally, you can include a createdAt timestamp
        },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        link: `https://${BUCKET}.s3.amazonaws.com/${filename}`,
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
