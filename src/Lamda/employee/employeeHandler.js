const {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  GetItemCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const {QueryCommand } = require("@aws-sdk/client-dynamodb");
// const {
//   validateEmployeeDetails,
//   validateUpdateEmployeeDetails,
// } = require("../validator/validateRequest");
// const {
//   updateEmployeeAllowedFields,
// } = require("../validator/validateFields");
const {
  httpStatusCodes,
  httpStatusMessages,
} = require("../../environment/appconfig");
const currentDate = Date.now(); // get the current date and time in milliseconds
const formattedDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss"); //formating date

const createEmployee = async (event) => {
  console.log("Create employee details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const requestBody = JSON.parse(event.body);

    // Check if the employeeId already exists
    const employeeIdExists = await isEmployeeIdExists(requestBody.employeeId);
    if (employeeIdExists) {
      throw new Error("EmployeeId already exists.");
    }

    // Check if the email address already exists
    const emailExists = await isEmailExists(requestBody.officeEmailAddress);
    if (emailExists) {
      throw new Error("Email address already exists.");
    }

    // Fetch the highest highestSerialNumber from the DynamoDB table
    const highestSerialNumber = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber);
    const nextSerialNumber = highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;

    // Fetch the highest assignmentId from the DynamoDB table
    const highestAssignmentId = await getHighestAssignmentId();
    console.log("Highest Assignment ID:", highestAssignmentId);
    const nextAssignmentId = highestAssignmentId !== null ? parseInt(highestAssignmentId) + 1 : 1;

    // Update the params object with the assignmentId
    requestBody.assignmentId = nextAssignmentId;

    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      Item: marshall({
        serialNumber: nextSerialNumber,
        employeeId: requestBody.employeeId,
        firstName: requestBody.firstName,
        lastName: requestBody.lastName,
        dateOfBirth: requestBody.dateOfBirth,
        officeEmailAddress: requestBody.officeEmailAddress,
        // Add other employee details here...
        assignmentId: nextAssignmentId // Set the assignmentId here
      }),
    };
    const createResult = await client.send(new PutItemCommand(params));

    const requiredAssignmentFields = [
      "designation",
      "branchOffice",
    ];
    if (!requiredAssignmentFields.every((field) => requestBody[field])) {
      throw new Error("Required Assignment Fields are missing.");
    }

    // Set onsite based on branchOffice
    let onsite = "No"; // Default value
    if (requestBody.branchOffice === "San Antonio, USA") {
      onsite = "Yes";
    }
    if (
      requestBody.branchOffice === null ||
      !["San Antonio, USA", "Bangalore, INDIA"].includes(
        requestBody.branchOffice
      )
    ) {
      throw new Error("Incorrect BranchOffice");
    }
    if (requestBody.designation === null || !["Software Engineer Trainee", "Software Engineer", "Senior Software Engineer", 
                                             "Testing Engineer Trainee", "Testing Engineer", "Senior Testing Engineer", 
                                             "Tech Lead", "Testing Lead", "Manager", "Project Manager", "Senior Manager", 
                                             "Analyst", "Senior Analyst", "Architect", "Senior Architect", "Solution Architect", 
                                             "Scrum Master", "Data Engineer"].includes(
    requestBody.designation)
    ) { 
      throw new Error("Incorrect Designation!");
    }

    const highestSerialNumber1 = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber1);
    const nextSerialNumber1 =
      highestSerialNumber1 !== null ? parseInt(highestSerialNumber1) + 1 : 1;

    const assignmentParams = {
      TableName: process.env.ASSIGNMENTS_TABLE, // Use ASSIGNMENTS_TABLE environment variable
      Item: marshall({
        assignmentId: nextAssignmentId,
        employeeId: requestBody.employeeId,
        branchOffice: requestBody.branchOffice,
        designation: requestBody.designation,
        onsite: onsite,
        department: requestBody.department || null,
        framework: requestBody.framework || null,
        coreTechnology: requestBody.coreTechnology || null,
        reportingManager: requestBody.reportingManager || null,
        billableResource: requestBody.billableResource || null,
        createdDateTime: formattedDate,
      }),
    };

    const createAssignmentResult = await client.send(new PutItemCommand(assignmentParams));

    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_EMPLOYEE_DETAILS,
      employeeId: requestBody.employeeId,
      assignmentId: nextAssignmentId
    });
  } catch (e) {
    console.error(e);
    response.statusCode = httpStatusCodes.BAD_REQUEST;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_CREATE_EMPLOYEE_DETAILS,
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }
  return response;
};


const updateEmployee = async (event) => {
  console.log("Update employee details");
  const response = { statusCode: httpStatusCodes.SUCCESS };

  try {
    const requestBody = JSON.parse(event.body);
    console.log("Request Body:", requestBody);
    const currentDate = Date.now();
    const formattedDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss");
    const employeeId = event.pathParameters
      ? event.pathParameters.employeeId
      : null;
    if (!employeeId) {
      console.log("Employee Id is required");
      throw new Error(httpStatusMessages.EMPLOYEE_ID_REQUIRED);
    }

    const getItemParams = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: marshall({ employeeId }),
    };
    const { Item } = await client.send(new GetItemCommand(getItemParams));
    if (!Item) {
      console.log(`Employee with employeeId ${employeeId} not found`);
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: `Employee with employeeId ${employeeId} not found`,
      });
      return response;
    }

    requestBody.updatedDateTime = formattedDate;

    const objKeys = Object.keys(requestBody).filter((key) =>
      updateEmployeeAllowedFields.includes(key)
    );
    console.log(`Employee with objKeys ${objKeys} `);
    const validationResponse = validateUpdateEmployeeDetails(requestBody);
    console.log(
      `valdation : ${validationResponse.validation} message: ${validationResponse.validationMessage} `
    );

    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: validationResponse.validationMessage,
      });
      return response;
    }

    const officeEmailAddressExists = await isEmailNotEmployeeIdExists(
      requestBody.officeEmailAddress,
      employeeId
    );
    if (officeEmailAddressExists) {
      console.log("officeEmailAddress already exists.");
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: "officeEmailAddress already exists.",
      });
      return response;
    }

    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: marshall({ employeeId }),
      UpdateExpression: `SET ${objKeys
        .map((_, index) => `#key${index} = :value${index}`)
        .join(", ")}`,
      ExpressionAttributeNames: objKeys.reduce(
        (acc, key, index) => ({
          ...acc,
          [`#key${index}`]: key,
        }),
        {}
      ),
      ExpressionAttributeValues: marshall(
        objKeys.reduce(
          (acc, key, index) => ({
            ...acc,
            [`:value${index}`]: requestBody[key],
          }),
          {}
        )
      ),
      ":updatedDateTime": requestBody.updatedDateTime,
    };

    const updateResult = await client.send(new UpdateItemCommand(params));
    console.log("Successfully updated Employee details.");
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_UPDATED_EMPLOYEE_DETAILS,
      employeeId: employeeId,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = 400;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_UPDATED_EMPLOYEE_DETAILS,
      employeeId: requestBody.employeeId, // If you want to include employeeId in the response
      errorMsg: e.message,
    });
  }
  return response;
};

const getEmployee = async (event) => {
  console.log("Get employee details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: marshall({ employeeId: event.pathParameters.employeeId }),
    };
    const { Item } = await client.send(new GetItemCommand(params));
    console.log({ Item });
    if (!Item) {
      console.log("Employee details not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.EMPLOYEE_DETAILS_NOT_FOUND,
      });
    } else {
      console.log("Successfully retrieved Employee details.");

      // Fetch assignments for the current employee
      const employeeId = event.pathParameters.employeeId;
      const assignmentsParams = {
        TableName: process.env.ASSIGNMENTS_TABLE,
        FilterExpression: "employeeId = :employeeId",
        ExpressionAttributeValues: {
          ":employeeId": { S: employeeId },
        },
      };
      const assignmentsCommand = new ScanCommand(assignmentsParams);
      const { Items: assignmentItems } = await client.send(assignmentsCommand);

      const employeeData = unmarshall(Item);
      // Attach assignments to the employee object
      employeeData.assignments = assignmentItems.map(unmarshall);

      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_EMPLOYEE_DETAILS,
        data: employeeData,
      });
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: e.statusCode || httpStatusCodes.INTERNAL_SERVER_ERROR,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_EMPLOYEE_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};


const getAllEmployees = async (event) => {
  const response = { 
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  };
  try {
    const { Items: employeeItems } = await client.send(
      new ScanCommand({ TableName: process.env.EMPLOYEE_TABLE })
    );

    if (!employeeItems || employeeItems.length === 0) {
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.EMPLOYEE_DETAILS_NOT_FOUND,
      });
      return response;
    }

    const queryParams = event.queryStringParameters || {};
    const designations = queryParams.designations ? queryParams.designations.split(',') : [];

    const employeesData = [];

    for (const employeeItem of employeeItems) {
      const employee = unmarshall(employeeItem);

      // Fetch assignments for the current employee
      try {
        const params = {
          TableName: process.env.ASSIGNMENTS_TABLE,
          FilterExpression: "employeeId = :employeeId",
          ExpressionAttributeValues: {
            ":employeeId": employee.employeeId,
          },
        };
        const { Items: assignmentItems } = await client.send(new ScanCommand(params));

        // Check if assignmentItems is defined and not empty
        const assignments = assignmentItems ? assignmentItems.map(item => unmarshall(item)) : [];

        // Filtering based on provided designations
        if (designations.length === 0 || assignments.some(assignment => designations.includes(assignment.designation))) {
          employee.assignments = assignments;
          employeesData.push(employee);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        throw error; // re-throwing the error to be caught by the outer catch block
      }
    }

    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_EMPLOYEES_DETAILS,
      data: employeesData,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = httpStatusCodes.INTERNAL_SERVER_ERROR;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_RETRIEVE_EMPLOYEE_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};


// Function to check if employeeId already exists
const isEmployeeIdExists = async (employeeId) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    Key: { employeeId: { S: employeeId } },
  };
  const { Item } = await client.send(new GetItemCommand(params));
  // If Item is not null, employeeId exists
  return !!Item;
};

const isEmailExists = async (emailAddress) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    FilterExpression: "officeEmailAddress = :email",
    ExpressionAttributeValues: {
      ":email": { S: emailAddress },
    },
    ProjectionExpression: "officeEmailAddress",
  };

  const command = new ScanCommand(params);
  const data = await client.send(command);
  return data.Items.length > 0;
};

const isEmailNotEmployeeIdExists = async (emailAddress, employeeId) => {
  console.log("in side isEmailNotEmployeeIdExists");
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    FilterExpression: "officeEmailAddress = :email AND employeeId <> :id",
    ExpressionAttributeValues: {
      ":email": { S: emailAddress },
      ":id": { S: employeeId }, // Assuming employeeId is a string, adjust if needed
    },
    ProjectionExpression: "officeEmailAddress",
  };
  const command = new ScanCommand(params);
  const data = await client.send(command);
  return data.Items.length > 0;
};

async function getHighestSerialNumber() {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    ProjectionExpression: "serialNumber",
    Limit: 100, // Increase the limit to retrieve more items for sorting
  };

  try {
    const result = await client.send(new ScanCommand(params));

    // Sort the items in descending order based on assignmentId
    const sortedItems = result.Items.sort((a, b) => {
      return parseInt(b.serialNumber.N) - parseInt(a.serialNumber.N);
    });

    console.log("Sorted Items:", sortedItems); // Log the sorted items

    if (sortedItems.length === 0) {
      return 0; // If no records found, return null
    } else {
      const highestSerialNumber = parseInt(sortedItems[0].serialNumber.N);
      console.log("Highest Assignment ID:", highestSerialNumber);
      return highestSerialNumber;
    }
  } catch (error) {
    console.error("Error retrieving highest serial number:", error);
    throw error; // Propagate the error up the call stack
  }
}

module.exports = {
  createEmployee,
  updateEmployee,
  getEmployee,
  getAllEmployees,
};
