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

// Function to extract file from multipart/form-data
function extractFile(event) {
  console.log('Event body:', event.body);
  const contentType = event.headers['Content-Type'];
  if (!contentType) {
    throw new Error('Content-Type header is missing in the request.');
  }

  // Boundary
  const boundary = parseMultipart.getBoundary(contentType);
  if (!boundary) {
    throw new Error('Unable to determine the boundary from the Content-Type header.');
  }

  const parts = parseMultipart.Parse(Buffer.from(event.body, 'base64'), boundary);
  console.log('--------parts', parts);

  if (!parts || parts.length === 0) {
    throw new Error('No parts found in the multipart request.');
  }

  const [{ filename, data }] = parts;

  if (!filename || !data) {
    throw new Error('Invalid or missing file name or data in the multipart request.');
  }

  return {
    filename,
    data,
  };
}

module.exports.createEducation = async (event) => {
  try {
    // Upload file to S3
    const { filename, data } = extractFile(event);
    await s3.putObject({ Bucket: BUCKET, Key: filename, Body: data }).promise();

    // Extract data from form data
    const formData = parseFormData(event);
    const { educationId, degree, course, university, graduationPassingYear } = formData;

    // Check if education already exists for the employee
    const existingEducation = await getEducationByEmployee(educationId);
    if (existingEducation) {
      throw new Error("Education details already exist for the employee.");
    }

    // Get the next education ID
    const nextSerialNumber = await getHighestSerialNumber();

    // Save data to EDUCATION_TABLE
    const params = {
      TableName: process.env.EDUCATION_TABLE,
      Item: marshall({
        educationId: nextSerialNumber,
        degree,
        course,
        university,
        graduationPassingYear,
        createdDateTime: formattedDate,
        updatedDateTime: null,
      }),
    };
    await client.send(new PutItemCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Education details saved successfully.",
        educationId: nextSerialNumber,
        link: `https://${BUCKET}.s3.amazonaws.com/${filename}`,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};

// Function to parse form data and extract required fields
function parseFormData(event) {
  const body = event.body;
  const parts = parseMultipart.Parse(Buffer.from(body, "base64"), event.headers["content-type"]);
  const formData = {};

  parts.forEach(part => {
    if (part.filename) {
      formData.filename = part.filename;
      formData.data = part.data;
    } else {
      formData[part.name] = part.data.toString();
    }
  });

  return formData;
}

