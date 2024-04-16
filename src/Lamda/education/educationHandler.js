const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient();

exports.createEducation = async (event) => {
  try {
    // Parse multipart form data
    const bodyBuffer = Buffer.from(event.body, 'base64');
    const boundary = event.headers['Content-Type'].split('boundary=')[1];
    const parts = parseMultipart(bodyBuffer, boundary);

    // Find the degree field
    let degree;
    for (const part of parts) {
      if (part.fieldName === 'degree') {
        degree = part.data.toString();
        break;
      }
    }

    if (!degree) {
      throw new Error('Degree field not found in the request');
    }

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
