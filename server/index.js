import { config } from './config.js'
import { serverInstance } from './server.js'
import { logger } from './util.js'

const port = config.server.port
// const host = config.server.host

serverInstance
  .listen(port)
  // .on('listening', () => logger.info(`Sever run at http://${host}:${port}`))
  .on('listening', () => logger.info(`Sever run at port ${port}`))

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.stack || err}`)
  // process.exit(1)
})

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.stack || err}`)
  // process.exit(1)
})
