const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
 
const client = new DynamoDBClient();
 
exports.createEducation = async (event) => {
  try {
    console.log("body", event.body);
    console.log("body", event.body.degree);
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