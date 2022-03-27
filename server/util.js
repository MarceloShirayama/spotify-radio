import pino from 'pino'
import pretty from 'pino-pretty'

const enabled = !!!process.env.LOG_DISABLED

const optionsPretty = pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  // translateTime: 'SYS:classic',
  // translateTime: 'SYS:iso',
  // translateTime: 'SYS:locale:en-US',
  // translateTime: 'SYS:custom:yy-mm-dd HH:mm:ss.l',
  ignore: 'pid,hostname'
})

export const logger = pino({ enabled }, optionsPretty)
