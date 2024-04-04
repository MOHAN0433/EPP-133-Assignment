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
      ];
      if (!requiredFields.every((field) => requestBody[field])) {
        throw new Error("Required fields are missing.");
      }

      const validatePanNumber = (panNumber) => {
        const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]/;
        return panRegex.test(panNumber);
    };

    if (!validatePanNumber(requestBody.panNumber)) {
      throw new Error("Invalid PAN Number. PAN Number should be in the format ABCDE1234F.");
  }

const numericFields = [
  "basicPay",
  "HRA",
  "medicalAllowances",
  "conveyances",
  "otherEarnings",
  "bonus",
  "variablePay",
  "enCashment",
  "incomeTax",
  "professionalTax",
  "providentFund"
];

for (const field of numericFields) {
  if (requestBody[field] !== undefined || requestBody[field] !== null ) {
      if (requestBody[field] === '' || typeof requestBody[field] == 'string') {
          throw new Error(`${field} must be a non-null non-empty number if provided.`);
      }
  }
}

      const totalEarnings = requestBody.basicPay + requestBody.HRA + requestBody.medicalAllowances + requestBody.conveyances + requestBody.otherEarnings + requestBody.bonus + requestBody.variablePay + requestBody.enCashment;
      const totalDeductions = requestBody.incomeTax + requestBody.professionalTax + requestBody.providentFund;
      const totalNetPay = totalEarnings - totalDeductions;
  
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
            console.log("Payroll ID from DynamoDB:", payrollIdObj); 
            const payrollId = parseInt(payrollIdObj.N); 
            console.log("Parsed Payroll ID:", payrollId);
            return payrollId;
          }
        } catch (error) {
          console.error("Error retrieving highest serial number:", error);
          throw error; // Propagate the error up the call stack
        }
      }
      
      // Check if an assignment already exists for the employee
      const existingPayroll = await getPayrollByPanNumber(
        requestBody.panNumber, requestBody.employeeId
      );
      if (existingPayroll) {
        throw new Error("A payroll already exists for this Pan Number or Employee ID.");
    }
  
      async function getPayrollByPanNumber(panNumber, employeeId) {
        const params = {
          TableName: process.env.PAYROLL_TABLE,
          FilterExpression: "panNumber = :panNumber OR employeeId = :employeeId",
          ExpressionAttributeValues: {
            ":panNumber": { S: panNumber }, // panNumber is a string
            ":employeeId": { S: employeeId },
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
          basicPay: requestBody.basicPay || null,
          HRA : requestBody.HRA || null,
          medicalAllowances : requestBody.medicalAllowances || null,
          conveyances : requestBody.conveyances || null,
          otherEarnings : requestBody.otherEarnings || null,
          bonus: requestBody.bonus || null,
          variablePay: requestBody.variablePay || null,
          enCashment: requestBody.enCashment || null,
          earnings: totalEarnings,
          incomeTax : requestBody.incomeTax || null,
          professionalTax : requestBody.professionalTax || null,
          providentFund : requestBody.providentFund || null,
          deductions: totalDeductions,
          netPay: totalNetPay,
          createdDateTime: formattedDate,
          updatedDateTime: null,
        }),
      };
  
      const createResult = await client.send(new PutItemCommand(params));
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_CREATED_PAYROLL_DETAILS,
        bankId: nextSerialNumber,
        employeeId:employeeId,
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

  const getPayrollByEmployeeId = async (event) => {
    console.log("Fetching payroll details by employee ID");
    const employeeId = event.pathParameters.employeeId;
  
    const response = { statusCode: httpStatusCodes.SUCCESS };
    try {
      const params = {
        TableName: process.env.PAYROLL_TABLE,
        FilterExpression: 'employeeId = :employeeId',
        ExpressionAttributeValues: {
          ':employeeId': { S: employeeId } // Assuming employeeId is a string, adjust accordingly if not
        }
      };
      const command = new ScanCommand(params);
      const { Items } = await client.send(command);
  
      if (!Items || Items.length === 0) {
        console.log("Assignments for employee not found.");
        response.statusCode = httpStatusCodes.NOT_FOUND;
        response.body = JSON.stringify({
          message: httpStatusMessages.PAYROLL_NOT_FOUND_FOR_EMPLOYEE,
        });
      } else {
        console.log("Successfully retrieved assignments for employee.");
        response.body = JSON.stringify({
          message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_PAYROLL_FOR_EMPLOYEE,
          data: Items.map(item => unmarshall(item)) // Unmarshalling each item
        });
      }
    } catch (error) {
      console.error(error);
      response.statusCode = httpStatusCodes.INTERNAL_SERVER_ERROR;
      response.body = JSON.stringify({
        message: httpStatusMessages.FAILED_TO_RETRIEVE_ASSIGNMENTS,
        error: error.message
      });
    }
    return response;
  };

  module.exports = {
    createPayroll,
    getPayrollByEmployeeId
  };