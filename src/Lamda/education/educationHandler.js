const parseMultipart = require('parse-multipart');
const moment = require("moment");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient();

function extractDegree(event) {
  try {
    const contentType = event.headers['Content-Type'];
    console.log('Content-Type:', contentType);

    if (!contentType) {
      throw new Error('Content-Type header is missing in the request.');
    }

    const boundary = parseMultipart.getBoundary(contentType);
    console.log('Boundary:', boundary);

    if (!boundary) {
      throw new Error(
        'Unable to determine the boundary from the Content-Type header.'
      );
    }

    const parts = parseMultipart.Parse(
      Buffer.from(event.body, 'base64'),
      boundary
    );
    console.log('Parts:', parts);

    const degreePart = parts.find(part => part.fieldName === 'degree');
    console.log('Degree part:', degreePart);

    if (!degreePart || !degreePart.data) {
      throw new Error('Degree field not found in the multipart request.');
    }

    return degreePart.data.toString();
  } catch (error) {
    console.error('Error extracting degree:', error);
    throw error;
  }
}


module.exports.createEducation = async (event) => {
  try {
    console.log('event full body:', event.body);
    console.log('rewuest event:', event.body.degree);
    const degree = extractDegree(event);

    // Save degree in DynamoDB
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
      body: JSON.stringify({
        degree: degree,
      }),
    };
  } catch (err) {
    console.log('error-----', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
