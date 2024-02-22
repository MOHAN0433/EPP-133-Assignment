const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const currentDate = Date.now(); // get the current date and time in milliseconds
const formattedDate = moment(currentDate).format("YYYY-MM-DD HH:mm:ss"); // formatting date

const createBankDetails = async (event) => {
  console.log("Create employee details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const requestBody = JSON.parse(event.body);
    console.log("Request Body:", requestBody);

    // Retrieve onsite value based on employeeId
    const onsiteStatus = await getOnsiteStatus(requestBody.employeeId);
    console.log("Onsite Status:", onsiteStatus);

    const getOnsiteStatus = async (employeeId) => {
        const params = {
            TableName: process.env.ASSIGNMENTS_TABLE,
          Key: marshall({
            assignmentId : requestBody.assignmentId,
            employeeId: employeeId,
          }),
        };
      
        try {
          const result = await client.send(new GetItemCommand(params));
          if (!result.Item) {
            throw new Error("Employee not found in ASSIGNMENT_TABLE.");
          }
          // Assuming onsite status is stored as a String attribute named 'onsite'
          return result.Item.onsite.S;
        } catch (error) {
          console.error("Error retrieving employee onsite status:", error);
          throw error;
        }
      };
    

    // If onsite status is true, perform validation for required fields
    if (onsiteStatus === 'Yes') {
        const requiredFields = ["bankName", "bankAddress", "ifscCode", "accountHolderName", "accountNumber", "accountType"];
        if (!requiredFields.every((field) => requestBody[field])) {
          throw new Error("Required fields are missing.");
        }
      } else if (onsiteStatus === 'No') {
        const requiredFields = ["bankName", "branchAddress", "accountHolderName", "accountNumber", "accountType", "routingNumber", "accountHolderResidentialAddress"];
        if (!requiredFields.every((field) => requestBody[field])) {
          throw new Error("Required fields are missing.");
        }
      } else {
        throw new Error("Invalid onsite status."); // Handle other cases if needed
      }

    const highestSerialNumber1 = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber1);
    const nextSerialNumber1 = highestSerialNumber !== null ? parseInt(highestSerialNumber1) + 1 : 1;
    async function getHighestSerialNumber() {
      const params = {
        TableName: process.env.BANK_TABLE,
        ProjectionExpression: "assignmentId",
        Limit: 100, // Increase the limit to retrieve more items for sorting
      };

      try {
        const result = await client.send(new ScanCommand(params));

        // Sort the items in descending order based on assignmentId
        const sortedItems = result.Items.sort((a, b) => {
          return parseInt(b.assignmentId.N) - parseInt(a.assignmentId.N);
        });

        console.log("Sorted Items:", sortedItems); // Log the sorted items

        if (sortedItems.length === 0) {
          return 0; // If no records found, return null
        } else {
          const highestAssignmentId = parseInt(sortedItems[0].assignmentId.N);
          console.log("Highest Assignment ID:", highestAssignmentId);
          return highestAssignmentId;
        }
      } catch (error) {
        console.error("Error retrieving highest serial number:", error);
        throw error; // Propagate the error up the call stack
      }
    }

    // Check if an assignment already exists for the employee
    const existingBank = await getBankByEmployeeId(requestBody.employeeId);
    if (existingBank) {
      throw new Error("Bank already exists for this employee.");
    }

    async function getBankByEmployeeId(employeeId) {
      const params = {
        TableName: process.env.BANK_TABLE,
        FilterExpression: "employeeId = :employeeId",
        ExpressionAttributeValues: {
          ":employeeId": { S: employeeId },
        },
      };

      try {
        const result = await client.send(new ScanCommand(params));
        return result.Items.length > 0;
      } catch (error) {
        console.error("Error retrieving Bank details by employeeId:", error);
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
      TableName: process.env.ASSIGNMENTS_TABLE, // Use ASSIGNMENTS_TABLE environment variable
      Item: marshall({
        bankId: nextSerialNumber1,
        employeeId: requestBody.employeeId,
        bankName: requestBody.bankName,
        bankAddress:requestBody.bankAddress,
        ifscCode: requestBody.ifscCode,
        accountHolderName: requestBody.accountHolderName,
        accountNumber: requestBody.accountNumber,
        accountType: requestBody.accountType,
        //onsite: onsite,
        branchAddress: requestBody.branchAddress,
        routingNumber: requestBody.routingNumber,
        accountHolderResidentialAddress : requestBody.accountHolderResidentialAddress,
        createdDateTime: formattedDate,
        updatedDateTime: requestBody.updatedDateTime
      }),
    };

    const createResult = await client.send(new PutItemCommand(params));
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_BANK_DETAILS,
      createResult,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = httpStatusCodes.BAD_REQUEST;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_CREATE_BANK_DETAILS,
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }
  return response;
};

// const getOnsiteStatus = async (employeeId) => {
//     const params = {
//         TableName: process.env.ASSIGNMENTS_TABLE,
//       Key: marshall({
//         assignmentId : requestBody.assignmentId,
//         employeeId: employeeId,
//       }),
//     };
  
//     try {
//       const result = await client.send(new GetItemCommand(params));
//       if (!result.Item) {
//         throw new Error("Employee not found in ASSIGNMENT_TABLE.");
//       }
//       // Assuming onsite status is stored as a String attribute named 'onsite'
//       return result.Item.onsite.S;
//     } catch (error) {
//       console.error("Error retrieving employee onsite status:", error);
//       throw error;
//     }
//   };

module.exports = {
    createBankDetails,
};
