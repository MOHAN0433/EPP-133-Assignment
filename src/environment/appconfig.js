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
    FAILED_TO_UPDATED_EMPLOYEE_DETAILS: "Failed to update Assignment details.",
    SUCCESSFULLY_RETRIEVED_ASSIGNMENTS_FOR_EMPLOYEE: "Assignment details retrieved.",
    ASSIGNMENTS_NOT_FOUND_FOR_EMPLOYEE: "Assignments not found.",
    ASSIGNMENT_ID_REQUIRED: "AssignmenId required.",
    FAILED_TO_RETRIEVE_METADATA_DETAILS: "Failed to retrieve Metadata Details.",
    SUCCESSFULLY_RETRIEVED_METADATA_DETAILS : "Successfully retrieved metadata.",
    METADATA_DETAILS_NOT_FOUND : "Metadata details not found.",
    SUCCESSFULLY_CREATED_BANK_DETAILS : "Successfully created baank details.",
    FAILED_TO_CREATE_BANK_DETAILS : "Failed to create bank details.",
    FAILED_TO_RETRIEVE_ASSIGNMENT_DETAILS : "Failed to retrieve Assignment details.",
    SUCCESSFULLY_CREATED_PAYROLL_DETAILS : "successfully created payroll details.",
    FAILED_TO_CREATE_PAYROLL_DETAILS : "Failed to create payroll details.",
    PAYROLL_NOT_FOUND_FOR_EMPLOYEE : "Payroll Not found for employee.",
    SUCCESSFULLY_RETRIEVED_PAYROLL_FOR_EMPLOYEE : "Successfully retrieved payroll detail.",
    FAILED_TO_CREATE_EDUCATION_DETAILS : "Failed to create education details.",
    SUCCESSFULLY_CREATED_EDUCATION_DETAILS : "Successfully created education details.",
    SUCCESSFULLY_CREATED_CERTIFICATION_DETAILS : "Successfully created certification details.",
    FAILED_TO_CREATE_CERTIFICATION_DETAILS : "Failed to create certification details."
    


  };
  
  module.exports = {
    httpStatusCodes,
    httpStatusMessages,
  };
  