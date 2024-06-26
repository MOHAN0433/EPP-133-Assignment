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
const sgMail = require('@sendgrid/mail');
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
const attendanceFormattedDate = moment(currentDate).format("YYYY-MM-DD");

const createEmployee = async (event) => {
  console.log("Create employee details");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    const requestBody = JSON.parse(event.body);

    // const validationResponse = validateEmployeeDetails(requestBody);
    // console.log(
    //   `valdation : ${validationResponse.validation} message: ${validationResponse.validationMessage} `
    // );

    // if (!validationResponse.validation) {
    //   console.log(validationResponse.validationMessage);
    //   response.statusCode = 400;
    //   response.body = JSON.stringify({
    //     ErrorMessage: validationResponse.validationMessage,
    //   });
    //   return response;
    // }

    // const emailExists = await isEmailExists(requestBody.officialEmailId);
    // if (emailExists) {
    //   console.log("Email address already exists.");
    //   throw new Error("Email address already exists.");
    // }
    const newEmployeeId = await autoIncreamentId(
      process.env.EMPLOYEE_TABLE,
      "employeeId"
    );
    console.log("new employee id : ", newEmployeeId);
    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      Item: marshall({
        employeeId: newEmployeeId,
        firstName: requestBody.firstName,
        lastName: requestBody.lastName,
        name: `${requestBody.firstName} ${requestBody.lastName}`,
        dateOfBirth: requestBody.dateOfBirth,
        officialEmailId: requestBody.officialEmailId,
        designation: requestBody.designation || null,
        branchOffice: requestBody.branchOffice || null,
        password: requestBody.password || null,
        gender: requestBody.gender || null,
        ssnNumber: requestBody.ssnNumber || null,
        maritalStatus: requestBody.maritalStatus || null,
        nationality: requestBody.nationality || null,
        passportNumber: requestBody.passportNumber || null,
        mobileNumber: requestBody.mobileNumber || null,
        permanentAddress: requestBody.permanentAddress || null,
        contactPerson: requestBody.contactPerson || null,
        personalEmailAddress: requestBody.personalEmailAddress || null,
        presentAddress: requestBody.presentAddress || null,
        contactNumber: requestBody.contactNumber || null,
        joiningDate: requestBody.joiningDate || null,
        emergencyContactPerson: requestBody.emergencyContactPerson || null,
        panNumber: requestBody.panNumber || null,
        emergencyContactNumber: requestBody.emergencyContactNumber || null,
        resignedDate: requestBody.resignedDate || null,
        relievedDate: requestBody.relievedDate || null,
        leaveStructure: requestBody.leaveStructure || null,
        department: requestBody.department || null,
        aadhaarNumber: requestBody.aadhaarNumber || null,
        role: requestBody.role || null,
        status: "active",
        isAbsconded: "No",
        createdDateTime: formattedDate,
        updatedDateTime: null,
      }),
    };
    
    let onsite = "No";
    if (requestBody.branchOffice === "San Antonio, USA") {
      onsite = "Yes";
    }
    const newAssignmentId = await autoIncreamentId(
      process.env.ASSIGNMENTS_TABLE,
      "assignmentId"
    );
    const assignmentParams = {
      TableName: process.env.ASSIGNMENTS_TABLE,
      Item: marshall({
        assignmentId: newAssignmentId,
        employeeId: newEmployeeId,
        branchOffice: requestBody.branchOffice || null,
        role: requestBody.role || null,
        designation: requestBody.designation || null,
        onsite: onsite,
        department: requestBody.department || null,
        framework: requestBody.framework || null,
        coreTechnology: requestBody.coreTechnology || null,
        managerId: requestBody.managerId || null,
        reportingManager: requestBody.reportingManager || null,
        billableResource: requestBody.billableResource || null,
        createdDateTime: formattedDate,
        updatedDateTime: null,
      }),
    };
    

    const newAttendanceId = await autoIncreamentId(
      process.env.EMPLOYEE_ATTENDANCE,
      "attendanceId"
    );
    const AttendanceParams = {
      TableName: process.env.EMPLOYEE_ATTENDANCE,
      Item: marshall({
        attendanceId: newAttendanceId,
        employeeId: requestBody.employeeId,
        checkInTime:"",
        checkOutTime: "",
        date: attendanceFormattedDate,
        day_status: "Absent",
        early_checkout: "",
        late_in: "",
        shift_name: "",
        short_hours: "",
        worked_hours: ""
      }),
    };
 
    const createResult = await client.send(new PutItemCommand(params));
    const createAssignmentResult = await client.send(
      new PutItemCommand(assignmentParams)
    );
    const createAttendenceResult = await client.send(new PutItemCommand(AttendanceParams));
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_EMPLOYEE_DETAILS,
      data: {
        employeeId: newEmployeeId,
        attendanceId: newAttendanceId,
        assignmentId: newAssignmentId,
      },
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
  console.log("Get all employees");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  const { pageNo, pageSize, searchText } = event.queryStringParameters;
  let designationFilter = [];
  let branchFilter = [];

  if (event.multiValueQueryStringParameters && event.multiValueQueryStringParameters.designation) {
    designationFilter = event.multiValueQueryStringParameters.designation
      .flatMap((designation) => designation.split(",")); // Split by commas if exists
  }
  if (event.multiValueQueryStringParameters && event.multiValueQueryStringParameters.branchOffice) {
    branchFilter = event.multiValueQueryStringParameters.branchOffice
      .flatMap((branchOffice) => branchOffice.split(",")); // Split by commas if exists
  }

  try {
    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
    };
    const { Items } = await client.send(new ScanCommand(params));

    let filteredItems = Items;

    // Apply search criteria if provided
    if (searchText) {
      console.log("Applying search criteria:", searchText);
      filteredItems = applySearchCriteria(Items, searchText);
      if (filteredItems.length === 0) {
        throw new Error("No employees found matching the search criteria.");
      }
    }
    
    // Apply filters if provided
    if (designationFilter.length > 0 || branchFilter.length > 0) {
      console.log(
        "Filtering started with designationFilter:",
        designationFilter,
        "and branchFilter:",
        branchFilter
      );
      filteredItems = applyFilters(filteredItems, designationFilter, branchFilter);
      if (filteredItems.length === 0) {
        throw new Error("No employees found matching the filter criteria.");
      }
      console.log("Filtered items:", filteredItems);
    }

    // Apply pagination
    const paginatedData = pagination(filteredItems.map((item) => unmarshall(item)), pageNo, pageSize);

    if (!paginatedData.items || paginatedData.items.length === 0) {
      console.log("No employees found after filtering.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.EMPLOYEES_DETAILS_NOT_FOUND,
      });
    } else {
      console.log("Successfully retrieved filtered and paginated employees.");
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_EMPLOYEES_DETAILS,
        data: paginatedData,
      });
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: e.statusCode,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_EMPLOYEE_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};

const applySearchCriteria = (employeesData, searchText) => {
  console.log("Applying search criteria:", searchText);
  return employeesData.filter(employee => matchesSearchText(employee, searchText));
};

const applyFilters = (employeesData, designationFilter, branchFilter) => {
  console.log("Applying filters...");
  return employeesData.filter(employee => {
    // Check if employee.branch exists before accessing its properties
    if (!employee.branchOffice || !employee.branchOffice.S || !employee.designation || !employee.designation.S) {
      // If employee data is incomplete, skip filtering for this employee
      return false;
    }
    console.log("Employee:", employee);
    const passesDesignationFilter = designationFilter.length === 0 ||
      (employee.designation && designationFilter.includes(employee.designation.S));
    // Note: Use `.S` to access the string value of DynamoDB attributes
    const passesBranchFilter = branchFilter.length === 0 || matchesBranch(employee.branchOffice.S, branchFilter);
    const passesFilters = passesDesignationFilter && passesBranchFilter;
    return passesFilters;
  });
};

const matchesSearchText = (employee, searchText) => {
  // Check if search text meets the minimum character requirement for name search
  if (searchText.length < 3) {
    throw new Error("Search text for name must be at least 3 characters long.");
  }
  const name = employee.name ? employee.name.S.toLowerCase() : "";
  //const employeeId = employee.employeeId ? employee.employeeId.N.toString() : ""; // Convert to string for comparison
  return (
    name.includes(searchText.toLowerCase()) 
  //  || employeeId === searchText
  );
};

const matchesBranch = (employeeBranch, branchFilter) => {
  for (const filter of branchFilter) {
    const phrases = filter.split(',').map(phrase => phrase.trim());
    if (phrases.some(phrase => employeeBranch.includes(phrase))) {
      return true;
    }
  }
  return false;
};

const pagination = (allItems, pageNo, pageSize) => {
  console.log("inside the pagination function");
  console.log("items length", allItems.length);

  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (pageNo - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const items = allItems.slice(startIndex, endIndex);
  return {
    items,
    totalItems,
    currentPage: pageNo,
    totalPages
  };
};

// Function to check if employeeId already exists
const isEmployeeIdExists = async (employeeId) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    Key: { employeeId: { N: employeeId } },
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
      ":id": { N: employeeId }, // Assuming employeeId is a string, adjust if needed
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

const autoIncreamentId = async (table, id) => {
  const params = {
    TableName: table,
    ProjectionExpression: id,
    Limit: 1000,
    ScanIndexForward: false,
  };

  try {
    const result = await client.send(new ScanCommand(params));
    console.log("Method autoIncreamentId DynamoDB Result ", id, " : ", result.Items.length);
    if (!result.Items || result.Items.length === 0) {
      return 1;
    } else {
      let incrementIdObj;
      let increamentId;
      if ("employeeId" === id) {
        console.log("Create employeeId");
        const sortedItems = result.Items.filter((item) => item.employeeId && !isNaN(item.employeeId.N));
        if (sortedItems.length > 0) {
          sortedItems.sort((a, b) => parseInt(b.employeeId.N) - parseInt(a.employeeId.N));
          incrementIdObj = sortedItems[0];
          increamentId = parseInt(incrementIdObj.employeeId.N);
        } else {
          increamentId = 0;
        }
      } else if ("assignmentId" === id) {
        console.log("Create assignmentId");
        const sortedItems = result.Items.filter((item) => item.assignmentId && !isNaN(item.assignmentId.N));
        if (sortedItems.length > 0) {
          sortedItems.sort((a, b) => parseInt(b.assignmentId.N) - parseInt(a.assignmentId.N));
          incrementIdObj = sortedItems[0];
          increamentId = parseInt(incrementIdObj.assignmentId.N);
        } else {
          increamentId = 0;
        }
      }else if ("attendanceId" === id) {
        console.log("Create attendanceId");
        const sortedItems = result.Items.filter((item) => item.attendanceId && !isNaN(item.attendanceId.N));
        if (sortedItems.length > 0) {
          sortedItems.sort((a, b) => parseInt(b.attendanceId.N) - parseInt(a.attendanceId.N));
          incrementIdObj = sortedItems[0];
          increamentId = parseInt(incrementIdObj.attendanceId.N);
        } else {
          increamentId = 0;
        }
      }
      const nextSerialNumber = increamentId !== null ? parseInt(increamentId) + 1 : 1;
      console.log("New Increament Id", nextSerialNumber);
      return nextSerialNumber;
    }
  } catch (error) {
    console.error("Error create new Increament id:", error);
    throw error;
  }
};

module.exports = {
  createEmployee,
  updateEmployee,
  getEmployee,
  getAllEmployees,
};
