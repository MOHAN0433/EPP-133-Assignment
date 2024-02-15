const updateEmployeeAllowedFields = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "officeEmailAddress",
  "branchOffice",
  "password",
  "gender",
  "ssnNumber",
  "aadharNumber",
  "maritalStatus",
  "nationality",
  "passportNumber",
  "mobileNumber",
  "permanentAddress",
  "contactPerson",
  "personalEmailAddress",
  "presentAddress",
  "contactNumber",
  "joiningDate",
  "emergencyContactPerson",
  "designation",
  "emergencyContactNumber",
  "resignedDate",
  "relievedDate",
  "leaveStructure",
  "department",
  "IsAbsconded",
  "status",
  "updatedDateTime",
];

const updateAssignmentAllowedFields = [
  "department",
  "branchOffice",
  "framework",
  "designation",
  "coreTechnology",
  "reportingManager",
  "onsite",
  "billableResource",
  "updatedDateTime",
];

module.exports = {
  updateEmployeeAllowedFields,
  updateAssignmentAllowedFields
};
