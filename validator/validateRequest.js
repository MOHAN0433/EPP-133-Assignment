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

const validateBranchOffice = (branchOffice) => {
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

const validateEmployeeDetails = (requestBody) => {
  const { employeeId, firstName, lastName, dateOfBirth, officeEmailAddress, branchOffice } = requestBody;

  // Check if required fields are missing
  if (!employeeId || !firstName || !lastName || !dateOfBirth || !officeEmailAddress || !branchOffice) {
    return false;
  } else if (!officeEmailAddress.endsWith("hyniva.com")) {
    throw new Error('Invalid officeEmailAddress domain. It should end with "hyniva.com".');
  }
  // You can add more specific validation logic for each field if needed
  return true;
};
const validateUpdateEmployeeDetails = (requestBody) => {
  console.log("validateUpdateEmployeeDetails method");

  const response = {
    validation: false,
    validationMessage: "Valid Data",
  };

  if (!validatePhone(requestBody.mobileNumber)) {
    response.validationMessage = "Invalid Mobile Number it will allow 10 to 16 digits";
    return response;
  }
  if (!validatePhone(requestBody.contactNumber)) {
    response.validationMessage = "Invalid Contact Number it will allow 10 to 16 digits";
    return response;
  }
  if (!validatePhone(requestBody.emergencyContactNumber)) {
    response.validationMessage = "Invalid Emergency Contact Number it will allow 10 to 16 digits";
    return response;
  }
  if (!validateSsnNumber(requestBody.ssnNumber)) {
    response.validationMessage = "Invalid SSN Number it will allow only 9 digits";
    return response;
  }
  if (!validateAadharNumber(requestBody.aadharNumber)) {
    response.validationMessage = "Invalid Aadhar Number it will allow only 12 digits";
    return response;
  }
  if (!validatePassportNumber(requestBody.passportNumber)) {
    response.validationMessage = "Invalid Passport Number it will allow 8 to 12 digits";
    return response;
  }
  if (!validateOfficeEmailAddress(requestBody.officeEmailAddress)) {
    response.validationMessage = "Invalid Office Email Address it will allow @hyniva.com";
    return response;
  }
  if (!validateEmailAddress(requestBody.personalEmailAddress)) {
    response.validationMessage = "Invalid Personal Email Address";
    return response;
  }
  if (!validateStatus(requestBody.status)) {
    response.validationMessage = "Invalid status. Status should be either 'active' or 'inactive'.";
    return response;
  }
  if (!validateGender(requestBody.gender)) {
    response.validationMessage = "Invalid gender. Gender should be either 'male' or 'female'.";
    return response;
  }
  if (!validatemaritalStatus(requestBody.maritalStatus)) {
    response.validationMessage = "Invalid marital Status. Marital Status should be either 'Single' or 'Married' or 'Divorced'.";
    return response;
  }
  if (!validateIsAbsconded(requestBody.absconded)) {
    response.validationMessage = "Invalid is Absconded. Is Absconded should be either 'Yes' or 'No'.";
    return response;
  }
  if (!validateDate(requestBody.joiningDate)) {
    response.validationMessage = `joiningDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validateDate(requestBody.resignedDate)) {
    response.validationMessage = `resignedDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validateDate(requestBody.relievedDate)) {
    response.validationMessage = `relievedDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validateDate(requestBody.dateOfBirth)) {
    response.validationMessage = `dateOfBirth should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  response.validation = true;
  return response;
};


const validatePhone = (phoneNumber) => {
  if (phoneNumber === null || phoneNumber === undefined) {
    return true;
  }
  const phoneNumberPattern = /^\d{10,16}$/;
  if (phoneNumber.toString().match(phoneNumberPattern)) {
    return true;
  } else {
    return false;
  }
};

const validateSsnNumber = (ssnNumber) => {
  if (ssnNumber === null || ssnNumber === undefined) {
    return true; // Allow null or undefined values
  }
  const numberPattern = /^\d{9}$/;
  if (numberPattern.test(ssnNumber)) {
    return true;
  } else {
    return false;
  }
};

const validateAadharNumber = (aadharNumber) => {
  if (aadharNumber === null || aadharNumber === undefined) {
    return true; // Allow null or undefined values
  }
  const numberPattern = /^\d{12}$/;
  if (numberPattern.test(aadharNumber)) {
    return true;
  } else {
    return false;
  }
};

const validatePassportNumber = (passportNumber) => {
  if (passportNumber === null || passportNumber === undefined) {
    return true; // Allow null or undefined values
  }
  const numberPattern = /^\d{8,12}$/;
  if (numberPattern.test(passportNumber)) {
    return true;
  } else {
    return false;
  }
};

const validateOfficeEmailAddress = (officeEmailAddress) => {
  if (officeEmailAddress === null || officeEmailAddress === undefined) {
    return true; // Allow null or undefined values
  }
  const emailPattern = /^[^\s@]+@hyniva\.com$/;
  return emailPattern.test(officeEmailAddress);
};

const validateEmailAddress = (emailAddress) => {
  if (emailAddress === null || emailAddress === undefined) {
    return true; // Allow null or undefined values
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(emailAddress);
};

const validateDate = (date) => {
  if (date === null || date === undefined) {
    return true; // Allow null or undefined values
  }
  const datePattern = /^\d{2}-\d{2}-\d{4}$/;
  if (datePattern.test(date)) {
    return true;
  } else {
    return false;
  }
};

const validateIsAbsconded = (isAbsconded) => {
  if (isAbsconded === null || isAbsconded === undefined) {
    return true; // Allow null or undefined values
  }
  return ["Yes", "No"].includes(isAbsconded);
};

const validateStatus = (status) => {
  if (status === null || status === undefined) {
    return true; // Allow null or undefined values
  }
  return ["active", "inactive"].includes(status);
};

const validateGender = (gender) => {
  if (gender === null || gender === undefined) {
    return true; // Allow null or undefined values
  }
  return ["male", "female"].includes(gender);
};
const validatemaritalStatus = (maritalStatus) => {
  if (maritalStatus === null || maritalStatus === undefined) {
    return true; // Allow null or undefined values
  }
  return ["Single", "Married", "Divorced"].includes(maritalStatus);
};

module.exports = {
  validateEmployeeDetails,
  validateUpdateEmployeeDetails,
  validateUpdateAssignmentDetails
};

