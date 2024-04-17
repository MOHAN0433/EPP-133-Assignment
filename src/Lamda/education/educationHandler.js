const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient();

exports.createEducation = async (event) => {
  try {
    console.log("body", event.body);

    // Parse multipart form data
    const boundary = parseMultipart.getBoundary(event.headers['Content-Type']);
    const parts = parseMultipart(event.body, boundary);

    let degree = '';

    // Iterate over parts to find the degree field
    parts.forEach(part => {
      if (part.filename === undefined) {
        if (part.name === 'degree') {
          degree = part.data.toString('utf-8');
        }
      }
    });

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