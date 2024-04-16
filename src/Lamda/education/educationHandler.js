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
    const params = {
        TableName: EDUCATION_TABLE,
        Item: {
            degree: { S: degree } // Assuming 'degree' is a string attribute
        }
    };
    
    // Create a PutItemCommand
    const putCommand = new PutItemCommand(params);
    
    // Put the item into DynamoDB
    await dynamoDBClient.send(putCommand);
    
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