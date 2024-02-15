// 'use strict';

// const pino = require('pino');
// const { AppConfig, allowedLogLevels } = require('../environment/appconfig');

// const { performance } = require('perf_hooks');

// const parentLogger = pino({
//   name: 'Employee-Portal-management',
//   safe: true,
//   level: AppConfig.logLevel,
// });

// let log = parentLogger;

// async function logInfo(logobj, message, activityName) {
//   logobj.logLevel = allowedLogLevels.INFO;
//   logobj.logMessage = message;
//   logobj.activityTimeStamp = performance.now();
//   logobj.activity = activityName;
//   log.info(logobj);
// }

// async function logErr(logobj, message, activityName) {
//   logobj.logLevel = allowedLogLevels.ERROR;
//   logobj.logMessage = message;
//   logobj.activityTimeStamp = performance.now();
//   logobj.activity = activityName;
//   log.error(logobj);
// }

// async function logDebug(logobj, message, activityName) {
//   logobj.logLevel = allowedLogLevels.DEBUG;
//   logobj.logMessage = message;
//   logobj.activityTimeStamp = performance.now();
//   logobj.activity = activityName;
//   log.debug(logobj);
// }

// async function logWarn(logobj, message, activityName) {
//   logobj.logLevel = allowedLogLevels.WARN;
//   logobj.logMessage = message;
//   logobj.activityTimeStamp = performance.now();
//   logobj.activity = activityName;
//   log.warn(logobj);
// }


// module.exports = {
//   logInfo,
//   logErr,
//   logDebug,
//   logWarn,
// };