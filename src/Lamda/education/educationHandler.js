const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const moment = require("moment");

const client = new DynamoDBClient();

exports.createEducation = async (event) => {
    try {
        // Parse the JSON data from the request body
        const bodyData = JSON.parse(event.body);
        
        // Extract the degree from the parsed JSON data
        const degree = bodyData.degree;
        
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