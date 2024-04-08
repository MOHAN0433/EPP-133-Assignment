const AWS = require('aws-sdk');
const parseMultipart = require('parse-multipart');

const BUCKET = 'education0433'; // Change the bucket name to match the one defined in your serverless configuration

const s3 = new AWS.S3();

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
      'Invalid or missing filename or data in the multipart request.'
    );
  }

  return {
    filename,
    data,
  };
}

module.exports.createEducation = async (event) => { // Changed the function name to match the one in your serverless file
  try {
    const { filename, data } = extractFile(event);
    console.log('---------data', data);
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: filename,
        Body: data,
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
