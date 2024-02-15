// 'use strict';

// const { log, setHeaders } = require("../utils/logger");

// function apiResponse(response, event, logEvent) {
//   const httpResponse = {
//     statusCode: 200,
//     headers: setHeaders(event, logEvent),
//     body: Object.keys(response).length > 0 ? JSON.stringify(response) : null
//   };
//   log.info(httpResponse);
//   return httpResponse;
// }

// module.exports = { apiResponse };