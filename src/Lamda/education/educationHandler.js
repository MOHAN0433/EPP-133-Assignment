const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
 
const client = new DynamoDBClient();
 
const queryString = require('querystring');

exports.createEducation = async (event) => {
  try {
    console.log("body", event.body);
    
    // Decode the base64 encoded body
    const decodedBody = Buffer.from(event.body, 'base64').toString('utf-8');
    console.log("decoded body", decodedBody);
    
    // Extract the degree from the decoded form data
    const parsedBody = queryString.parse(decodedBody);
    const degree = parsedBody.degree;
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