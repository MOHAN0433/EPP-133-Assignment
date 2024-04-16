const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const parseMultipart = require('parse-multipart');
const moment = require("moment");

const client = new DynamoDBClient();

exports.createEducation = async (event) => {
    try {
        // Log the event to check its structure
        console.log('Event:', event);

        // Parse form-data from the event body
        const contentTypeHeader = event.headers['content-type'];
        console.log('Content-Type Header:', contentTypeHeader);

        const boundaryHeader = contentTypeHeader.split(';')[1].trim();
        console.log('Boundary Header:', boundaryHeader);

        const boundary = boundaryHeader.split('=')[1];
        console.log('Boundary:', boundary);

        const bodyBuffer = Buffer.from(event.body, 'base64');
        const parts = parseMultipart(bodyBuffer, boundary);

        // Extract the JSON data from the form-data
        let bodyData = '';
        parts.forEach(part => {
            if (part.fieldname === 'bodyData') {
                bodyData = part.data.toString();
            }
        });

        // Parse the JSON data
        const jsonData = JSON.parse(bodyData);

        // Extract degree and course from the parsed JSON data
        const degree = jsonData.degree;
        const course = jsonData.course;

        // Prepare the item to be inserted into DynamoDB
        await client.send(new PutItemCommand({
            TableName: process.env.EDUCATION_TABLE,
            Item: {
                educationId: { N: Date.now().toString() }, // Assuming educationId is a number
                degree: { S: degree },
                course: { S: course },
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
