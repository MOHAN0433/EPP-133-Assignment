const {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  GetItemCommand,
  ScanCommand,
  QueryCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const {
  httpStatusCodes,
  httpStatusMessages,
} = require("../../environment/appconfig");
const currentDate = Date.now(); // get the current date and time in milliseconds
const formattedDate = moment(currentDate).format("YYYY-MM-DD HH:mm:ss"); // formatting date
const parseMultipart = require('parse-multipart');
const BUCKET = 'education0433123';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const createEducation = async (event) => {
  console.log("Create emmployee details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const requestBody = JSON.parse(event.body);
    
    // Check for required fields
    const requiredFields = [
      "degree",
      "course",
      "university",
      "graduationPassingYear",
      "employeeId",
    ];
    if (!requiredFields.every((field) => requestBody[field])) {
      throw new Error("Required fields are missing.");
    }

const numericFields = [
"graduationPassingYear"
];

for (const field of numericFields) {
if (requestBody[field] !== undefined || requestBody[field] !== null ) {
    if (requestBody[field] === '' || typeof requestBody[field] == 'string') {
        throw new Error(`${field} must be a number.`);
    }
}
}
// Validate fields to allow only string values
const stringFields = ["degree", "course", "university"];
for (const field of stringFields) {
  if (typeof requestBody[field] !== "string") {
    throw new Error(`${field} must be a string.`);
  }
}

// Check if graduationPassingYear is a future year
const currentYear = new Date().getFullYear();
if (requestBody.graduationPassingYear > currentYear) {
  throw new Error("graduationPassingYear cannot be a future year.");
}

    const highestSerialNumber = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber);

    const nextSerialNumber =
      highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;
      async function getHighestSerialNumber() {
        const params = {
          TableName: process.env.EDUCATION_TABLE,
          ProjectionExpression: "educationId",
          Limit: 100, // Increase the limit to retrieve more items for sorting
        };
        try {
          const result = await client.send(new ScanCommand(params));
          // Sort the items in descending order based on assignmentId
          const sortedItems = result.Items.sort((a, b) => {
            return parseInt(b.educationId.N) - parseInt(a.educationId.N);
          });
          console.log("Sorted Items:", sortedItems); // Log the sorted items
          if (sortedItems.length === 0) {
            return 0; // If no records found, return null
          } else {
            const highestEducationId = parseInt(sortedItems[0].educationId.N);
            console.log("Highest educationId ID:", highestEducationId);
            return highestEducationId;
          }
        } catch (error) {
          console.error("Error retrieving highest serial number:", error);
          throw error; // Propagate the error up the call stack
        }
      }

    // Check if an education already exists for the employee
    const existingEducation = await getEducationByEmployee(
      requestBody.employeeId
    );
    if (existingEducation) {
      throw new Error("A Education Details already Employee ID.");
  }

    async function getEducationByEmployee(employeeId) {
      const params = {
        TableName: process.env.EDUCATION_TABLE,
        FilterExpression: "employeeId = :employeeId",
        ExpressionAttributeValues: {
          ":employeeId": { S: employeeId },
        },
      };

      try {
        const result = await client.send(new ScanCommand(params));
        return result.Items.length > 0;
      } catch (error) {
        console.error("Error retrieving payroll by employeeId:", error);
        throw error;
      }
    }

    const checkEmployeeExistence = async (employeeId) => {
      const params = {
        TableName: process.env.EMPLOYEE_TABLE,
        Key: { employeeId: { N: employeeId } },
      };

      try {
        const result = await client.send(new GetItemCommand(params));
        if (!result.Item) {
          throw new Error("Employee not found.");
        }
      } catch (error) {
        console.error("Error checking employee existence:", error);
        throw error;
      }
    };
    await checkEmployeeExistence(requestBody.employeeId);

    const params = {
      TableName: process.env.EDUCATION_TABLE,
      Item: marshall({
        educationId: nextSerialNumber,
        employeeId: requestBody.employeeId,
        degree: requestBody.degree,
        course: requestBody.course,
        university: requestBody.university,
        graduationPassingYear : requestBody.graduationPassingYear,
        createdDateTime: formattedDate,
        updatedDateTime: null,
      }),
    };

    await client.send(new PutItemCommand(params));
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_EDUCATION_DETAILS,
      educationId: nextSerialNumber,
      //employeeId:employeeId,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = httpStatusCodes.BAD_REQUEST;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_CREATE_EDUCATION_DETAILS,
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }
  return response;
};

const uploadEducation = async (event) => {
  try {
    // const employeeId = event.pathParameters.employeeId; // Assuming employeeId is provided in the path parameters as a string

    // if (!employeeId) {
    //   throw new Error('employeeId is required');
    // }

    const educationId = event.pathParameters.educationId; // Assuming employeeId is provided in the path parameters as a string

    if (!educationId) {
      throw new Error('educationId is required');
    }
    const { filename, data } = extractFile(event);

    // Upload file to S3
    await s3.putObject({
      Bucket: BUCKET,
      Key: filename,
      Body: data,
    }).promise();

    // Construct S3 object URL
    const s3ObjectUrl = `https://${BUCKET}.s3.amazonaws.com/${filename}`;

    // Check if an education already exists for the employee
    const existingEducation = await getEducationByEmployee(
      event.pathParameters.educationId
      );
      if (!existingEducation) {
        throw new Error("Education Details Not found.");
    }
    async function getEducationByEmployee(educationId) {
      const params = {
        TableName: process.env.EDUCATION_TABLE,
        KeyConditionExpression: "educationId = :educationId",
        ExpressionAttributeValues: {
          ":educationId": { "N": educationId.toString() },
        },
      };
    
      try {
        const result = await client.send(new QueryCommand(params));
        return result.Items.length > 0; // Assuming you want to return true if education exists, false otherwise
      } catch (error) {
        console.error("Error retrieving education by educationId:", error);
        throw error;
      }
    }
    

    // Update item in DynamoDB
    await client.send(new UpdateItemCommand({
      TableName: process.env.EDUCATION_TABLE,
      Key: {
        educationId: { N: educationId.toString() }, // Assuming educationId is a number
      },
      UpdateExpression: "SET link = :link",
      ExpressionAttributeValues: {
        ":link": { S: s3ObjectUrl },
      },
      ReturnValues: "ALL_NEW" // Return the updated item
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        link: s3ObjectUrl,
        message: "Education record updated successfully",
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


function extractFile(event) {
  const contentType = event.headers['Content-Type'];
  if (!contentType) {
    throw new Error('Content-Type header is missing in the request.');
  }
 
  const boundary = parseMultipart.getBoundary(contentType);
  if (!boundary) {
    throw new Error(
      'Unable to determine the boundary from the Content-Type header.'
    );
  }
 
  const parts = parseMultipart.Parse(
    Buffer.from(event.body, 'base64'),
    boundary
  );
 
  if (!parts || parts.length === 0) {
    throw new Error('No parts found in the multipart request.');
  }
 
  const [{ filename, data }] = parts;
 
  if (!filename || !data) {
    throw new Error(
      'Invalid or missing file name or data in the multipart request.'
    );
  }

  // Check file size (assuming data is in binary format)
  const fileSizeInMB = data.length / (1024 * 1024); // Convert bytes to MB
  const maxSizeInMB = 3;
  if (fileSizeInMB > maxSizeInMB) {
    throw new Error(`File size exceeds the maximum limit of ${maxSizeInMB} MB.`);
  }
 
  return {
    filename,
    data,
  };
}

module.exports = {
  createEducation,
  uploadEducation
};