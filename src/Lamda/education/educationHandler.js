const {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  GetItemCommand,
  ScanCommand,
  QueryCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const AWS = require('aws-sdk');
const client = new DynamoDBClient();
const {
  httpStatusCodes,
  httpStatusMessages,
} = require("../../environment/appconfig");
//const { getEducationByEmployeeId } = require("../education/educationHandler");
const currentDate = Date.now(); // get the current date and time in milliseconds
const formattedDate = moment(currentDate).format("YYYY-MM-DD HH:mm:ss"); // formatting date

const parseMultipart = require('parse-multipart');

const BUCKET = 'education0433123'; // Change the bucket name to match the one defined in your serverless 
const s3 = new AWS.S3();

function extractFile(event) {
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
    const { filename, data } = extractFile(event); // Extract file details
    console.log('File:', filename);

    const formData = extractFormData(event.body); // Extract form data fields
    console.log('Form Data:', formData);

    // Upload file to S3
    const s3Response = await s3.putObject({
      Bucket: BUCKET,
      Key: filename,
      Body: data,
    }).promise();
    console.log('S3 Response:', s3Response);

    // Save educational details to DynamoDB
    const educationItem = {
      degree: formData.degree,
      course: formData.course,
      university: formData.university,
      graduationPassingYear: formData.graduationPassingYear,
      fileUrl: `https://${BUCKET}.s3.amazonaws.com/${filename}`,
      // Add other fields as needed
    };
    const dbResponse = await client.send(new PutItemCommand({
      TableName: process.env.EDUCATION_TABLE,
      Item: marshall(educationItem),
    }));
    console.log('DB Response:', dbResponse);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Education details created successfully.",
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to create education details.", error: error.message }),
    };
  }
};

function extractFormData(body) {
  const formData = {};
  const parts = body.split(';');
  for (const part of parts) {
    const match = part.match(/name="(.*)"\r\n\r\n(.*)/s);
    if (match) {
      formData[match[1]] = match[2];
    }
  }
  return formData;
}

