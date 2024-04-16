const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient();

const EDUCATION_TABLE = 'EDUCATION_TABLE';

exports.createEducation = async (event) => {
  try {
    // Extract the degree from the form data
    const degree = event['body'].split('=')[1]; // Extract the value after '='
    
    // Prepare the item to be inserted into DynamoDB
    await client.send(new PutItemCommand({
      TableName: process.env.EDUCATION_TABLE,
      Item: {
        educationId: { N: Date.now().toString() }, // Assuming educationId is a number
        //link: { S: s3ObjectUrl },
        degree: { S: degree },
        createdAt: { S: moment().format("YYYY-MM-DD HH:mm:ss") }
      }
    }));
    
    // Create a PutItemCommand
    //const putCommand = new PutItemCommand(params);
    
    // Put the item into DynamoDB
    //await client.send(putCommand);
    
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