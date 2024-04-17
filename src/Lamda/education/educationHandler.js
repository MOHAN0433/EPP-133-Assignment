const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
 
const client = new DynamoDBClient();
 
exports.createEducation = async (event) => {
  try {
    console.log("body", event.body);
    // Extract the degree from the form data
    const bodyParts = event['body'].split(':');
    const degree = bodyParts.length >= 2 ? bodyParts[1].trim() : ''; // Extract the value after ':' and trim any whitespace, or use an empty string if not found
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