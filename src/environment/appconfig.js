const httpStatusCodes = {
    BAD_REQUEST: "400",
    INTERNAL_SERVER_ERROR: "500",
    SUCCESS: "200",
    NOT_FOUND: "404",
    UNAUTHORIZED: "401",
  };
  
  const httpStatusMessages = {
    SUCCESSFULLY_CREATED_EMPLOYEE_DETAILS: "Successfully created employee details.",
    FAILED_TO_CREATE_EMPLOYEE_DETAILS: "Failed to create employee details.",
    FAILED_TO_RETRIEVE_EMPLOYEE_DETAILS: "Failed to retrieve Employee details.",
    SUCCESSFULLY_RETRIEVED_EMPLOYEES_DETAILS: "Successfully retrieved Employees details.",
    SUCCESSFULLY_RETRIEVED_EMPLOYEE_DETAILS: "Successfully retrieved Employee details.",
    EMPLOYEE_DETAILS_NOT_FOUND: "Employee details not found.",
    EMPLOYEE_ID_REQUIRED: "Employee Id is required",
    SUCCESSFULLY_CREATED_ASSIGNMENT_DETAILS : "Successfully created Assignment details.",
    FAILED_TO_CREATE_ASSIGNMENT_DETAILS : "Failed to create Assignment details.",
    SUCCESSFULLY_UPDATED_EMPLOYEE_DETAILS: "Successfully updated Assignment details.",
    FAILED_TO_UPDATED_EMPLOYEE_DETAILS: "Failed to update Assignment details."
  };
  
  module.exports = {
    httpStatusCodes,
    httpStatusMessages,
  };
  