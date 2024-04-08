const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { parse } = require('aws-lambda-multipart-parser');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const dynamoDBClient = new DynamoDBClient();
const s3Client = new S3Client();
const s3 = new AWS.S3();
// Configure multer for file uploads
const upload = multer({ dest: '/tmp' });

exports.handler = async (event, context) => {
  try {
    // Parse form data using multer
    const formData = await parseFormData(event);

    // Validate request
    const { degree, course, university, graduationPassingYear, file } = formData;
    if (!degree || !course || !university || !graduationPassingYear || !file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    // Upload file to S3
    const fileName = `${uuidv4()}.pdf`;
    const s3Params = {
      Bucket: 'education0433', // Update with your S3 bucket name
      Key: fileName,
      Body: file.buffer,
      ContentType: 'application/pdf'
    };
    await s3.upload(s3Params).promise();

    const fileUrl = `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`;

    // Save data to DynamoDB
    const educationItem = {
      id: uuidv4(),
      degree,
      course,
      university,
      graduationPassingYear,
      fileUrl
    };

    const dbParams = {
      TableName: EDUCATION_TABLE,
      Item: educationItem
    };

    await dynamodb.put(dbParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Education record created successfully', educationItem })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

// Helper function to parse form data using multer
function parseFormData(event) {
  return new Promise((resolve, reject) => {
    upload.single('file')(event, null, async err => {
      if (err) {
        reject(err);
      } else {
        const { degree, course, university, graduationPassingYear } = event.body;
        const file = event.file;
        resolve({ degree, course, university, graduationPassingYear, file });
      }
    });
  });
}