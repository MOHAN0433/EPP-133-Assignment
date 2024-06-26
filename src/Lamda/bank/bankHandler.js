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
    const onsiteStatus = await getOnsiteStatus(parseInt(requestBody.assignmentId), parseInt(requestBody.employeeId));
    console.log("Onsite Status:", onsiteStatus);

    let bankFields = {};

    if (onsiteStatus === "No") {
      bankFields = {
        bankName: requestBody.bankName || null,
        bankAddress: requestBody.bankAddress || null,
        ifscCode: requestBody.ifscCode || null,
        accountHolderName: requestBody.accountHolderName || null,
        accountNumber: requestBody.accountNumber != null ? String(requestBody.accountNumber) : null,
        accountType: requestBody.accountType || null,
        routingNumber: null,
        accountHolderResidentialAddress: null,
      };
    } else if (onsiteStatus === "Yes") {
      bankFields = {
        bankName: requestBody.bankName || null,
        bankAddress: requestBody.bankAddress || null,
        ifscCode: requestBody.ifscCode || null,
        accountHolderName: requestBody.accountHolderName || null,
        accountNumber: /^\d+$/.test(requestBody.accountNumber) ? requestBody.accountNumber : null,        accountType: requestBody.accountType || null,
        routingNumber: requestBody.routingNumber != null ? String(requestBody.routingNumber) : null,
        accountHolderResidentialAddress: requestBody.accountHolderResidentialAddress || null,
      };
    }

    const highestSerialNumber1 = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber1);
    const nextSerialNumber1 = highestSerialNumber1 !== null ? parseInt(highestSerialNumber1) + 1 : 1;
    async function getHighestSerialNumber() {
      const params = {
        TableName: process.env.BANK_TABLE,
        ProjectionExpression: "bankId",
        Limit: 100, // Increase the limit to retrieve more items for sorting
      };

      try {
        const result = await client.send(new ScanCommand(params));

        // Sort the items in descending order based on bankId
        const sortedItems = result.Items.sort((a, b) => {
          return parseInt(b.bankId.N) - parseInt(a.bankId.N);
        });

        console.log("Sorted Items:", sortedItems); // Log the sorted items

        if (sortedItems.length === 0) {
          return 0; // If no records found, return null
        } else {
          const highestbankId = parseInt(sortedItems[0].bankId.N);
          console.log("Highest bank ID:", highestbankId);
          return highestbankId;
        }
      } catch (error) {
        console.error("Error retrieving highest serial number:", error);
        throw error; // Propagate the error up the call stack
      }
    }

    // Check if an assignment already exists for the employee
    const existingBank = await getBankByEmployeeId(parseInt(requestBody.employeeId));
    if (existingBank) {
      throw new Error("Bank already exists for this employee.");
    }

    async function getBankByEmployeeId(employeeId) {
      const params = {
        TableName: process.env.BANK_TABLE,
        FilterExpression: "employeeId = :employeeId",
        ExpressionAttributeValues: {
          ":employeeId": { N: String(employeeId) }, // Convert employeeId to string explicitly
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
      TableName: process.env.BANK_TABLE, // Use ASSIGNMENTS_TABLE environment variable
      Item: marshall({
        bankId: nextSerialNumber1,
        employeeId: requestBody.employeeId,
        ...bankFields,
        createdDateTime: formattedDate,
        updatedDateTime: requestBody.updatedDateTime || null,
      }),
    };

    const createResult = await client.send(new PutItemCommand(params));
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_BANK_DETAILS,
      bankId: nextSerialNumber1,
      employeeId: requestBody.employeeId,
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

const getOnsiteStatus = async (assignmentId, employeeId) => {
  const params = {
    TableName: process.env.ASSIGNMENTS_TABLE,
    Key: marshall({
      assignmentId: assignmentId,
      employeeId: employeeId,
    }),
  };

  try {
    const result = await client.send(new GetItemCommand(params));
    if (!result.Item) {
      throw new Error("Employee not Matched in ASSIGNMENT_TABLE.");
    }
    // Assuming onsite status is stored as a String attribute named 'onsite'
    return result.Item.onsite.S;
  } catch (error) {
    console.error("Error retrieving employee onsite status:", error);
    throw error;
  }
};

module.exports = {
  createBankDetails,
};
