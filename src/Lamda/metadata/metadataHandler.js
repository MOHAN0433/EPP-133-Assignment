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

const getAllMeatadatas = async () => {
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const { Items } = await client.send(
      new ScanCommand({ TableName: process.env.METADATA_TABLE })
    ); // Getting table name from the servetless.yml and setting to the TableName

    if (Items.length === 0) {
      // If there is no employee details found
      response.statusCode = httpStatusCodes.NOT_FOUND; // Setting the status code to 404
      response.body = JSON.stringify({
        message: httpStatusMessages.METADATA_DETAILS_NOT_FOUND,
      }); // Setting error message
    } else {
      const sortedItems = Items.sort((a, b) =>
       parseInt(a.metadataId.N) - parseInt(b.metadataId.N)
      );

      // Map and set "password" field to null
      const metadataList = sortedItems.map((item) => {
        const metadata = unmarshall(item);
        return metadata;
      });

      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_METADATA_DETAILS,
        data: metadataList,
      });
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: httpStatusCodes.INTERNAL_SERVER_ERROR,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_METADATA_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};

module.exports = {
  getAllMeatadatas,
};