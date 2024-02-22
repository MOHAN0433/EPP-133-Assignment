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
  
  const filterItems = (items, filterConditions) => {
    // If no filter conditions provided, return items as it is
    if (!filterConditions || Object.keys(filterConditions).length === 0) {
        return items;
    }

    // Filter items based on filter conditions
    return items.filter(item => {
        for (let key in filterConditions) {
            if (item[key] && item[key].S !== filterConditions[key]) {
                return false;
            }
        }
        return true;
    });
};

const getAllMeatadatas = async (event) => {
  const filterConditions = event.queryStringParameters || {}; // Extract filter conditions from query parameters
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
      const { Items } = await client.send(
          new ScanCommand({ TableName: process.env.METADATA_TABLE })
      );

      if (Items.length === 0) {
          response.statusCode = httpStatusCodes.NOT_FOUND;
          response.body = JSON.stringify({
              message: httpStatusMessages.METADATA_DETAILS_NOT_FOUND,
          });
      } else {
          const sortedItems = Items.sort((a, b) =>
              a.metadataId.N.localeCompare(b.metadataId.N)
          );

          let filteredItems = sortedItems;
          if (Object.keys(filterConditions).length > 0) {
              filteredItems = filterItems(sortedItems, filterConditions);
          }

          const metadataList = filteredItems.map(item => unmarshall(item));

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
