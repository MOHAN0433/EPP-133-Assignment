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
  
  const createPayroll = async (event) => {
    console.log("Create employee details");
    const response = { statusCode: httpStatusCodes.SUCCESS };
    try {
      const requestBody = JSON.parse(event.body);
      console.log("Request Body:", requestBody);
  
      // Check for required fields
      const requiredFields = [
        "panNumber",
        "employeeId",
        "basicPay",
        "Earnings",
        "deductions",
        "netPay",
        "bonus",
        "variablePay",
        "enCashment",
      ];
      if (!requiredFields.every((field) => requestBody[field])) {
        throw new Error("Required fields are missing.");
      }
     
      // if (
      //   requestBody.branchOffice === null ||
      //   !["San Antonio, USA", "Bangalore, INDIA"].includes(
      //     requestBody.branchOffice
      //   )
      // ) {
      //   throw new Error("Incorrect BranchOffice");
      // }
  
      const highestSerialNumber = await getHighestSerialNumber();
      console.log("Highest Serial Number:", highestSerialNumber);
  
      const nextSerialNumber =
        highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;
      async function getHighestSerialNumber() {
        const params = {
          TableName: process.env.PAYROLL_TABLE,
          ProjectionExpression: "payrollId",
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
            const payrollIdObj = result.Items[0].payrollId;
            console.log("Payroll ID from DynamoDB:", payrollIdObj); // Add this line to see the retrieved payroll object
            const payrollId = parseInt(payrollIdObj.N); // Access the N property and parse as a number
            console.log("Parsed Payroll ID:", payrollId); // Log the parsed payrollId
            return payrollId;
          }
        } catch (error) {
          console.error("Error retrieving highest serial number:", error);
          throw error; // Propagate the error up the call stack
        }
      }
      
      // Check if an assignment already exists for the employee
      const existingPayroll = await getAssignmentByPanNumber(
        requestBody.panNumber
      );
      if (existingPayroll) {
        throw new Error("An Payroll already exists for this Pan Number.");
      }
  
      async function getAssignmentByPanNumber(panNumber) {
        const params = {
          TableName: process.env.PAYROLL_TABLE,
          FilterExpression: "panNumber = :panNumber",
          ExpressionAttributeValues: {
            ":panNumber": { S: panNumber }, // panNumber is a string
          },
        };
  
        try {
          const result = await client.send(new ScanCommand(params));
          return result.Items.length > 0;
        } catch (error) {
          console.error("Error retrieving payroll by panNumber:", error);
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
        TableName: process.env.PAYROLL_TABLE,
        Item: marshall({
          payrollId: nextSerialNumber,
          employeeId: requestBody.employeeId,
          panNumber: requestBody.panNumber,
          basicPay: requestBody.basicPay,
          Earnings: requestBody.Earnings,
          deductions: requestBody.deductions,
          netPay: requestBody.netPay,
          bonus: requestBody.bonus,
          //onsite: onsite,
          variablePay: requestBody.variablePay,
          enCashment: requestBody.enCashment,
          createdDateTime: formattedDate,
          updatedDateTime: null,
        }),
      };
  
      const createResult = await client.send(new PutItemCommand(params));
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_CREATED_PAYROLL_DETAILS,
        bankId: nextSerialNumber,
      });
    } catch (e) {
      console.error(e);
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
        message: httpStatusMessages.FAILED_TO_CREATE_PAYROLL_DETAILS,
        errorMsg: e.message,
        errorStack: e.stack,
      });
    }
    return response;
  };

  module.exports = {
    createPayroll,
  };