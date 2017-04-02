const winston = require('winston');
const level = process.env.LOG_LEVEL || 'silly'
winston.configure({
  // { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
  level,
  transports: [
    new (winston.transports.Console)({ colorize: true })
  ]
});

const debuggLevelMessage = 'Your level is '

winston.info('///////////////////////////////////')
winston.info('////Check your loggin level////////')
winston.info('///////////////////////////////////')
winston.error(debuggLevelMessage + level)
winston.warn(debuggLevelMessage + level)
winston.info(debuggLevelMessage + level)
winston.verbose(debuggLevelMessage + level)
winston.debug(debuggLevelMessage + level)
winston.silly(debuggLevelMessage + level)
winston.info('///////////////////////////////////')
winston.info('///////////////////////////////////')



module.exports = winston