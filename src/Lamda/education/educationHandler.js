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
  console.log("Create employee details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const requestBody = JSON.parse(event.body);
    console.log("Request Body:", requestBody);

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

//       const validatePanNumber = (panNumber) => {
//         const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]/;
//         return panRegex.test(panNumber);
//     };

//     if (!validatePanNumber(requestBody.panNumber)) {
//       throw new Error("Invalid PAN Number. PAN Number should be in the format ABCDE1234F.");
//   }

const numericFields = [
"graduationPassingYear"
];

for (const field of numericFields) {
if (requestBody[field] !== undefined || requestBody[field] !== null ) {
    if (requestBody[field] === '' || typeof requestBody[field] == 'string') {
        throw new Error(`${field} must be a non-null and non-empty number.`);
    }
}
}

  //   const totalEarnings = requestBody.basicPay + requestBody.HRA + requestBody.medicalAllowances + requestBody.conveyances + requestBody.otherEarnings + requestBody.bonus + requestBody.variablePay + requestBody.enCashment;
  //   const totalDeductions = requestBody.incomeTax + requestBody.professionalTax + requestBody.providentFund;
  //   const totalNetPay = totalEarnings - totalDeductions;

    const highestSerialNumber = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber);

    const nextSerialNumber =
      highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;
    async function getHighestSerialNumber() {
      const params = {
        TableName: process.env.EDUCATION_TABLE,
        ProjectionExpression: "educationId",
        Limit: 1,
        ScanIndexForward: false, // Sort in descending order to get the highest serial number first
      };

      try {
        const result = await client.send(new ScanCommand(params));
        console.log("DynamoDB Result:", result); // Add this line to see the DynamoDB response
        if (result.Items.length === 0) {
          return 0; // If no records found, return null
        } else {
          // Parse and return the highest serial number without incrementing
          const educationIdObj = result.Items[0].educationId;
          console.log("Education ID from DynamoDB:", educationIdObj); 
          const educationId = parseInt(educationIdObj.N); 
          console.log("Parsed Education ID:", educationId);
          return educationId;
        }
      } catch (error) {
        console.error("Error retrieving highest serial number:", error);
        throw error; // Propagate the error up the call stack
      }
    }

    // Check if an education already exists for the employee
    const existingEducation = await getEducationByEmployee(
      requestBody.employeeId, requestBody.employeeId
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
        Key: marshall({
          employeeId: employeeId,
        }),
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
    const employeeId = event.pathParameters.employeeId;
    const educationId = event.pathParameters.educationId;
    
    if (!employeeId || !educationId) {
      throw new Error('Both employeeId and educationId are required');
    }

    const { filename, data } = extractFile(event);

    // Upload file to S3
    await s3.putObject({
      Bucket: BUCKET,
      Key: filename,
      Body: data,
    }).promise();

    const s3ObjectUrl = `https://${BUCKET}.s3.amazonaws.com/${filename}`;

    // Construct update parameters
    const updateParams = {
      TableName: process.env.EDUCATION_TABLE,
      Key: marshall({
        educationId: educationId.toString(),
        employeeId: employeeId,
      }),
      UpdateExpression: 'SET link = :link',
      ExpressionAttributeValues: marshall({
        ':link': s3ObjectUrl,
      }),
    };

    // Execute the update operation
    await client.send(new UpdateItemCommand(updateParams));

    return {
      statusCode: 200,
      body: JSON.stringify({
        link: s3ObjectUrl,
      }),
    };
  } catch (err) {
    console.error('Error:', err);
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
 
  return {
    filename,
    data,
  };
}

module.exports = {
  createEducation,
  uploadEducation
};