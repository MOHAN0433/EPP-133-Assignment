const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const { S3 } = require('aws-sdk');
const parseMultipart = require('parse-multipart');

const BUCKET = 'education0433123';
const client = new DynamoDBClient();
const s3 = new S3();

const createEducation = async (event) => {
  console.log("Create education details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
      const formData = parseMultipart(event.body, event.headers['content-type']);
      console.log("Form Data:", formData);

      // Extract form fields
      const fields = {};
      formData.forEach(part => {
          if (part.filename) {
              // Upload education document to S3
              const s3Params = {
                  Bucket: BUCKET,
                  Key: part.filename,
                  Body: part.data,
              };
              s3.upload(s3Params).promise();
              fields.educationDocumentUrl = `https://${BUCKET}.s3.amazonaws.com/${part.filename}`;
          } else {
              fields[part.name] = part.data.toString('utf8');
          }
      });

      console.log("Form Fields:", fields);

      // Check for required fields
      const requiredFields = [
          "degree",
          "course",
          "university",
          "graduationPassingYear",
          "employeeId",
          "educationDocumentUrl"
      ];
      if (!requiredFields.every(field => fields[field])) {
          throw new Error("Required fields are missing.");
      }

      const formattedDate = moment().format("YYYY-MM-DD HH:mm:ss"); // formatting date

      const highestEducationId = await getHighestEducationId();
      console.log("Highest Education ID:", highestEducationId);

      const nextEducationId = highestEducationId !== null ? highestEducationId + 1 : 1;

      // Save education details to DynamoDB
      const params = {
          TableName: process.env.EDUCATION_TABLE,
          Item: marshall({
              educationId: nextEducationId,
              degree: fields.degree,
              course: fields.course,
              university: fields.university,
              graduationPassingYear: fields.graduationPassingYear,
              employeeId: fields.employeeId,
              educationDocumentUrl: fields.educationDocumentUrl,
              createdDateTime: formattedDate,
              updatedDateTime: null,
          }),
      };

      await client.send(new PutItemCommand(params));
      response.body = JSON.stringify({
          message: httpStatusMessages.SUCCESSFULLY_CREATED_EDUCATION_DETAILS,
          educationId: nextEducationId,
          employeeId: fields.employeeId,
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

module.exports = {
  createEducation,
};
