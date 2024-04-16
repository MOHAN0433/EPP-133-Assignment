const {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");

const BUCKET = 'education0433123';
const client = new DynamoDBClient();

const createEducation = async (event) => {
  console.log("Create education details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
      const requestBody = JSON.parse(event.body);
      console.log("Request Body:", requestBody);

      // Check for required fields
      const requiredFields = [
          "degree",
          "course",
          "university",
          "graduationPassingYear",
          "employeeId",
          "educationDocument" // Assuming education document is part of the request body
      ];
      if (!requiredFields.every((field) => requestBody[field])) {
          throw new Error("Required fields are missing.");
      }

      const formattedDate = moment().format("YYYY-MM-DD HH:mm:ss"); // formatting date

      const highestEducationId = await getHighestEducationId();
      console.log("Highest Education ID:", highestEducationId);

      const nextEducationId = highestEducationId !== null ? highestEducationId + 1 : 1;

      // Upload education document to S3
      const { filename, data } = extractFile(requestBody.educationDocument);
      const s3Params = {
          Bucket: process.env.BUCKET, // Replace with your S3 bucket name
          Key: filename,
          Body: data,
      };
      await s3.putObject(s3Params).promise();

      // Save education details to DynamoDB
      const params = {
          TableName: process.env.EDUCATION_TABLE,
          Item: marshall({
              educationId: nextEducationId,
              degree: requestBody.degree,
              course: requestBody.course,
              university: requestBody.university,
              graduationPassingYear: requestBody.graduationPassingYear,
              employeeId: requestBody.employeeId,
              educationDocumentUrl: `https://${BUCKET}.s3.amazonaws.com/${filename}`,
              createdDateTime: formattedDate,
              updatedDateTime: null,
          }),
      };

      await client.send(new PutItemCommand(params));
      response.body = JSON.stringify({
          message: httpStatusMessages.SUCCESSFULLY_CREATED_EDUCATION_DETAILS,
          educationId: nextEducationId,
          employeeId: requestBody.employeeId,
      });
  } catch (error) {
      console.error(error);
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
          message: httpStatusMessages.FAILED_TO_CREATE_EDUCATION_DETAILS,
          errorMsg: error.message,
          errorStack: error.stack,
      });
  }
  return response;
};

async function getHighestEducationId() {
  const params = {
      TableName: process.env.EDUCATION_TABLE,
      ProjectionExpression: "educationId",
      Limit: 1,
      ScanIndexForward: false, // Sort in descending order to get the highest education ID first
  };

  try {
      const result = await client.send(new ScanCommand(params));
      if (result.Items.length === 0) {
          return 0; // If no records found, return null
      } else {
          // Parse and return the highest education ID without incrementing
          return parseInt(result.Items[0].educationId.N);
      }
  } catch (error) {
      console.error("Error retrieving highest education ID:", error);
      throw error;
  }
}

function extractFile(educationDocument) {
  const contentType = educationDocument.headers['Content-Type'];
  if (!contentType) {
      throw new Error('Content-Type header is missing in the education document.');
  }

  const boundary = parseMultipart.getBoundary(contentType);
  if (!boundary) {
      throw new Error('Unable to determine the boundary from the Content-Type header.');
  }

  const parts = parseMultipart.Parse(Buffer.from(educationDocument.body, 'base64'), boundary);
  if (!parts || parts.length === 0) {
      throw new Error('No parts found in the education document.');
  }

  const [{ filename, data }] = parts;

  if (!filename || !data) {
      throw new Error('Invalid or missing file name or data in the education document.');
  }

  return {
      filename,
      data,
  };
}

module.exports = {
  createEducation,
};
