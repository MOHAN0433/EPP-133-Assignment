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
    console.log('Event Body:', event.body);
    const { filename, data } = extractFile(event); // Extract file details

    // Upload file to S3
    await s3.putObject({
      Bucket: BUCKET,
      Key: filename,
      Body: data,
    }).promise();

    // Extract educational details from form-data
    const formData = parseFormData(event.body);
    const {
      degree,
      course,
      university,
      graduationPassingYear,
      employeeId
    } = formData;

    // Validate and process educational details...

    // Save educational details to DynamoDB
    const params = {
      TableName: process.env.EDUCATION_TABLE,
      Item: {
        educationId: nextSerialNumber,
        degree,
        course,
        university,
        graduationPassingYear,
        fileUrl: `https://${BUCKET}.s3.amazonaws.com/${filename}`, // Include S3 file URL
        createdDateTime: formattedDate,
        updatedDateTime: null,
      },
    };

    await client.send(new PutItemCommand(params));

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

function parseFormData(formData) {
  console.log('FormData:', formData); // Log the formData variable
  const result = {};
  if (!formData) return result; // Return an empty object if formData is undefined or null
  
  const fields = formData.split(';');
  console.log('Fields:', fields); // Log the fields array
  for (const field of fields) {
    const [key, value] = field.split('=');
    console.log('Key:', key); // Log the key
    console.log('Value:', value); // Log the value
    result[key.trim()] = value.trim();
  }
  return result;
}
