const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { parse: multipartParse } = require('aws-lambda-multipart-parser'); // Rename the parse function to avoid conflicts
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const AWS = require('aws-sdk');
const multer = require('multer');

const dynamoDBClient = new DynamoDBClient();
const s3Client = new AWS.S3();

const upload = multer({ dest: '/tmp' });

const createEducation = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event));

    // Parse form data using multer
    const formData = await parseFormData(event);
    console.log('Parsed form data:', JSON.stringify(formData));

    // Validate request
    const { degree, course, university, graduationPassingYear, file } = formData;
    if (!degree || !course || !university || !graduationPassingYear || !file) {
      console.error('Missing required fields');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    // Upload file to S3
    console.log('Uploading file to S3...');
    const fileName = `${uuidv4()}.pdf`;
    const s3Params = {
      Bucket: 'education0433', // Update with your S3 bucket name
      Key: fileName,
      Body: file.buffer,
      ContentType: 'application/pdf'
    };
    await s3Client.upload(s3Params).promise();
    console.log('File uploaded to S3:', fileName);

    // Save data to DynamoDB
    console.log('Saving data to DynamoDB...');
    const educationItem = {
      id: uuidv4(),
      degree,
      course,
      university,
      graduationPassingYear,
      fileUrl: `https://${s3Params.Bucket}.s3.amazonaws.com/${s3Params.Key}`
    };

    const dbParams = {
      TableName: EDUCATION_TABLE,
      Item: educationItem
    };

    await dynamoDBClient.send(new PutItemCommand(dbParams)); // Update the DynamoDB call
    console.log('Data saved to DynamoDB:', educationItem);

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
        console.error('Error parsing form data:', err);
        reject(err);
      } else {
        console.log('Form data parsed successfully:', event.body);
        console.log('File details:', event.file);
        
        // Parse the form fields
        const degree = event.body.degree;
        const course = event.body.course;
        const university = event.body.university;
        const graduationPassingYear = event.body.graduationPassingYear;

        // Extract the file
        const file = event.file;

        resolve({ degree, course, university, graduationPassingYear, file });
      }
    });
  });
}

module.exports = {
  createEducation,
};
