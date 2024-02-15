const validateUpdateAssignmentDetails = (requestBody) => {
  console.log("validateUpdateEmployeeDetails method");

  const response = {
    validation: false,
    validationMessage: "Valid Data",
  };

  if (!validateGender(requestBody.branchOffice)) {
    response.validationMessage = "Invalid branchOffice. Gender should be either 'male' or 'female'.";
    return response;
  }
  if (!validateGender(requestBody.billableResource)) {
    response.validationMessage = "Invalid branchOffice. Gender should be either 'male' or 'female'.";
    return response;
  }
  if (!validateGender(requestBody.designation)) {
    response.validationMessage = "Invalid designation. Gender should be either 'male' or 'female'.";
    return response;
  }
  if (!validateGender(requestBody.department)) {
    response.validationMessage = "Invalid department. Gender should be either 'male' or 'female'.";
    return response;
  }
  response.validation = true;
  return response;
};

const validateGender = (branchOffice) => {
  if (branchOffice === null || branchOffice === undefined) {
    return true; // Allow null or undefined values
  }
  return ["San Antonio, USA", "Bangalore, INDIA"].includes(branchOffice);
};
const validateIsbillableResource = (billableResource) => {
  if (billableResource === null || billableResource === undefined) {
    return true; // Allow null or undefined values
  }
  return ["Yes", "No"].includes(billableResource);
};
const validateDesignation = (designation) => {
  if (designation === null || designation === undefined) {
    return true; // Allow null or undefined values
  }
  return [
    "Software Engineer Trainee",
    "Software Engineer",
    "Senior software Engineer",
    "Testing Engineer Trainee",
    "Testing Engineer",
    "Senior Testing Engineer",
    "Tech Lead",
    "Testing Lead",
    "Manager",
    "Project Manager",
    "Senior Manager",
    "Analyst",
    "Senior Analyst",
    "Architect",
    "Senior Architect",
    "Solution Architect",
    "Scrum Master",
    "Data Engineer",
  ].includes(designation);
};

const validateDepartment = (department) => {
    if (department === null || department === undefined) {
      return true; // Allow null or undefined values
    }
    return ["IT", "Non- IT", "Sales"].includes(department);
  };
module.exports = {
  validateUpdateAssignmentDetails,
};
