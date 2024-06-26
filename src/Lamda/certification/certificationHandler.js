const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const currentDate = Date.now(); // get the current date and time in milliseconds
const formattedDate = moment(currentDate).format("YYYY-MM-DD HH:mm:ss"); // formatting date
const parseMultipart = require("parse-multipart");
const path = require('path');
const BUCKET = process.env.BUCKET;
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const createCertification = async (event) => {
  console.log("Create Certification details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const requestBody = JSON.parse(event.body);

    // Check for required fields
    const requiredFields = ["technologyName", "certificationAuthority", "certifiedDate", "validityLastDate", "employeeId"];
    if (!requiredFields.every((field) => requestBody[field])) {
      throw new Error("Required fields are missing.");
    }

    const stringFields = ["technologyName"];
    for (const field of stringFields) {
      if (typeof requestBody[field] !== "string") {
        throw new Error(`${field} must be a string.`);
      }
    }

    const alphabetRegex = /^[A-Za-z\s]+$/;
    if (!alphabetRegex.test(requestBody.certificationAuthority)) {
      throw new Error("Technology name and certification authority must contain only alphabets.");
    }


      const validateDate = (date) => {
        if (date === null || date === undefined || date === "") {
          return true;
        }
        const datePattern = /^\d{2}-\d{2}-\d{4}$/;
        if (datePattern.test(date)) {
          return true;
        } else {
          return false;
        }
      };

      const validatePastAndCurrentDate = (date) => {
        console.log(date);
        if (date === null || date === undefined || date === "") {
          return true;
        }
        const currentDate = new Date();
        const inputDate = new Date(date);
        if (isNaN(inputDate.getTime())) {
          return false;
        }
        if (inputDate <= currentDate) {
          return true;
        } else {
          return false;
        }
      };
      const validateFeatureAndCurrentDate = (date) => {
        if (date === null || date === undefined || date === "") {
          return true;
        }
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
      
        const inputDate = new Date(date);
        inputDate.setHours(0, 0, 0, 0);
      
        if (isNaN(inputDate.getTime())) {
          return false;
        }
        if (inputDate >= currentDate) {
          return true;
        } else {
          return false;
        }
      };

      if (!validateDate(requestBody.certifiedDate)) {
        throw new Error(`certifiedDate  should be in format \"MM-DD-YYYY\"`);
        //return response;
      }
      if (!validateDate(requestBody.validityLastDate)) {
        throw new Error(`validityLastDate  should be in format \"MM-DD-YYYY\"`);
        //return response;
      }
      if (!validatePastAndCurrentDate(requestBody.certifiedDate)) {
        throw new Error(`certifiedDate should have Current and Past Date`);
        //return response;
      }
      if (!validateFeatureAndCurrentDate(requestBody.validityLastDate)) {
        throw new Error(`validityLastDate should have Current and feature Date`);
        //return response;
      }

      const certifiedDate = new Date(requestBody.certifiedDate);
    const validityLastDate = new Date(requestBody.validityLastDate);

    if (certifiedDate > validityLastDate) {
      throw new Error("CertifiedDate cannot be greater than validityLastDate.");
    }

    const highestSerialNumber = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber);

    const nextSerialNumber = highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;
    async function getHighestSerialNumber() {
      const params = {
        TableName: process.env.CERTIFICATION_TABLE,
        ProjectionExpression: "certificationId",
        Limit: 100, // Increase the limit to retrieve more items for sorting
      };
      try {
        const result = await client.send(new ScanCommand(params));
        // Sort the items in descending order based on assignmentId
        const sortedItems = result.Items.sort((a, b) => {
          return parseInt(b.certificationId.N) - parseInt(a.certificationId.N);
        });
        console.log("Sorted Items:", sortedItems); // Log the sorted items
        if (sortedItems.length === 0) {
          return 0; // If no records found, return null
        } else {
          const highestCertificationId = parseInt(sortedItems[0].certificationId.N);
          console.log("Highest certificationId ID:", highestCertificationId);
          return highestCertificationId;
        }
      } catch (error) {
        console.error("Error retrieving highest serial number:", error);
        throw error; // Propagate the error up the call stack
      }
    }

    // Check if an Certification already exists for the employee
    // const existingCertification = await getCertificationByEmployee(requestBody.employeeId);
    // if (existingCertification) {
    //   throw new Error("A Certification Details already exists for Employee ID.");
    // }

    // async function getCertificationByEmployee(employeeId) {
    //   const params = {
    //     TableName: process.env.CERTIFICATION_TABLE,
    //     FilterExpression: "employeeId = :employeeId",
    //     ExpressionAttributeValues: {
    //       ":employeeId": { S: employeeId },
    //     },
    //   };

    //   try {
    //     const result = await client.send(new ScanCommand(params));
    //     return result.Items.length > 0;
    //   } catch (error) {
    //     console.error("Error retrieving cerification by employeeId:", error);
    //     throw error;
    //   }
    // }

    const checkCerticationExistence = async (employeeId) => {
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
    await checkCerticationExistence(requestBody.employeeId);

    const params = {
      TableName: process.env.CERTIFICATION_TABLE,
      Item: marshall({
        certificationId: nextSerialNumber,
        employeeId: requestBody.employeeId,
        technologyName: requestBody.technologyName,
        certificationAuthority: requestBody.certificationAuthority,
        certifiedDate: requestBody.certifiedDate,
        validityLastDate: requestBody.validityLastDate,
        createdDateTime: formattedDate,
        updatedDateTime: null,
      }),
    };

    await client.send(new PutItemCommand(params));
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_CERTIFICATION_DETAILS,
      educationId: nextSerialNumber,
      //employeeId:employeeId,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = httpStatusCodes.BAD_REQUEST;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_CREATE_CERTIFICATION_DETAILS,
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }
  return response;
};

const uploadCertification = async (event) => {
  try {
    const certificationId = event.pathParameters.certificationId;

    const response = {
        statusCode: httpStatusCodes.SUCCESS,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };

    if (!certificationId) {
      throw new Error("certificationId is required");
    }
    // Check if an certification already exists for the employee
    const existingCertification = await getCertificationByEmployee(event.pathParameters.certificationId);
    if (!existingCertification) {
      throw new Error("Certification Details Not found.");
    }
    async function getCertificationByEmployee(certificationId) {
      const params = {
        TableName: process.env.CERTIFICATION_TABLE,
        KeyConditionExpression: "certificationId = :certificationId",
        ExpressionAttributeValues: {
          ":certificationId": { N: certificationId.toString() },
        },
      };

      try {
        const result = await client.send(new QueryCommand(params));
        return result.Items.length > 0;
      } catch (error) {
        console.error("Error retrieving certification by certificationId:", error);
        throw error;
      }
    }

    const { filename, data } = extractFile(event);

    // Modify filename to include certificationId
    const modifiedFilename = `${certificationId}_${filename.replace(/\s/g, "_")}`;

    // Check if an object with the same certificationId exists in the S3 bucket
// const listObjectsResponse = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
// const objectsWithSameCertificationId = listObjectsResponse.Contents.filter(object => object.Key.startsWith(`${certificationId}_`));

// If there are objects with the same certificationId, delete them
// if (objectsWithSameCertificationId.length > 0) {
//   await Promise.all(objectsWithSameCertificationId.map(object => {
//     return s3.deleteObject({ Bucket: BUCKET, Key: object.Key }).promise();
//   }));
// }

    // Upload file to S3
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: modifiedFilename,
        Body: data,
      })
      .promise();

    // Construct S3 object URL
    const s3ObjectUrl = `https://${BUCKET}.s3.amazonaws.com/${modifiedFilename}`;

    await client.send(
      new UpdateItemCommand({
        TableName: process.env.CERTIFICATION_TABLE,
        Key: {
          certificationId: { N: certificationId.toString() }, // Assuming educationId is a number
        },
        UpdateExpression: "SET link = :link",
        ExpressionAttributeValues: {
          ":link": { S: s3ObjectUrl },
        },
        ReturnValues: "ALL_NEW", // Return the updated item
      })
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
          link: s3ObjectUrl,
          message: "Certification Document updated successfully",
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } catch (err) {
      console.log("error-----", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: err.message }),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    }
  };

function extractFile(event) {
  const contentType = event.headers["Content-Type"];
  if (!contentType) {
    throw new Error("Content-Type header is missing in the request.");
  }

  const boundary = parseMultipart.getBoundary(contentType);
  if (!boundary) {
    throw new Error("Unable to determine the boundary from the Content-Type header.");
  }

  const parts = parseMultipart.Parse(Buffer.from(event.body, "base64"), boundary);

  if (!parts || parts.length === 0) {
    throw new Error("No parts found in the multipart request.");
  }

  const [{ filename, data }] = parts;

  if (!filename || !data) {
    throw new Error("Invalid or missing file name or data in the multipart request.");
  }

  const fileType = path.extname(filename).toLowerCase();
  if (fileType !== '.pdf') {
    throw new Error("Invalid file type. Only PDF files are allowed.");
  }

  // Check file size in binary format)
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
  createCertification,
  uploadCertification,
};
