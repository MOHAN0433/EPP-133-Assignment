const AWS = require('aws-sdk');
const parseMultipart = require('parse-multipart');
const { marshall } = require('@aws-sdk/util-dynamodb');

const BUCKET = 'education0433123'; // Change the bucket name to match the one defined in your serverless configuration
const EDUCATION_TABLE = process.env.EDUCATION_TABLE; // Assuming you have an environment variable for your education table

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();

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

  if (!parts || parts.length === 0) {
    throw new Error('No parts found in the multipart request.');
  }

  const [{ filename, data }] = parts;

  if (!filename || !data) {
    throw new Error(
      'Invalid or missing file name or data in the multipart request.'
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
    
    // Upload file to S3
    await s3.putObject({
      Bucket: BUCKET,
      Key: filename,
      Body: data,
    }).promise();

    // Construct education item for DynamoDB
    const educationItem = {
      educationId: Date.now().toString(), // Assuming you generate educationId dynamically
      fileName: filename,
      // Assuming you get degree, course, university, graduationPassingYear from the request body
      degree: event.body.degree,
      course: event.body.course,
      university: event.body.university,
      graduationPassingYear: event.body.graduationPassingYear
    };

    // Save education item to DynamoDB
    await dynamodb.putItem({
      TableName: EDUCATION_TABLE,
      Item: marshall(educationItem)
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        link: `https://${BUCKET}.s3.amazonaws.com/${filename}`,
        message: 'Education details saved successfully'
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
