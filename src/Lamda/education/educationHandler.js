const multipart = require('aws-lambda-multipart-parser');
const AWS = require('aws-sdk');
const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const BUCKET = 'education0433123';
const s3 = new AWS.S3();

const client = new DynamoDBClient();

// exports.createEducation = async (event) => {
//   try {
//     const parsedFormData = multipart.parse(event);
//     console.log("parsedFormData", parsedFormData.files)
//     // Access parsed fields
//     const degree = parsedFormData?.files?.degree?.content?.toString(); // Access value using the content property
//     const test = parsedFormData?.files?.test?.content?.toString(); // Access value using the content property
//     // Do something with the parsed fields
//     console.log('Degree:', degree || "");
//     console.log('Test:', test || "");
//     // Prepare the item to be inserted into DynamoDB
//     await client.send(new PutItemCommand({
//       TableName: process.env.EDUCATION_TABLE,
//       Item: {
//         educationId: { N: Date.now().toString() }, // Assuming educationId is a number
//         degree: { S: degree },
//         createdAt: { S: moment().format("YYYY-MM-DD HH:mm:ss") }
//       }
//     }));
//     return {
//       statusCode: 200,
//       body: JSON.stringify({ message: 'Degree saved successfully' })
//     };
//   } catch (error) {
//     console.error('Error saving degree:', error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ message: 'Error saving degree' })
//     };
//   }
// };

exports.createEducation = async (event) => {
  try {
    console.log("body", event.body)
    // Extract the degree from the form data
    const degree = event['body'].split('=')[1]; // Extract the value after '='
    console.log("degree", degree);
   
    // Prepare the item to be inserted into DynamoDB
    await client.send(new PutItemCommand({
      TableName: process.env.EDUCATION_TABLE,
      Item: {
        educationId: { N: Date.now().toString() }, // Assuming educationId is a number
        degree: { S: degree },
        createdAt: { S: moment().format("YYYY-MM-DD HH:mm:ss") }
      }
    }));
   
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Degree saved successfully' })
    };
} catch (error) {
    console.error('Error saving degree:', error);
    return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error saving degree' })
    };
}
};