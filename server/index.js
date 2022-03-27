import { config } from './config.js'
import { server } from './server.js'
import { logger } from './util.js'

const port = config.server.port
const host = config.server.host

server
  .listen(port)
  .on('listening', () => logger.info(`Sever run at http://${host}:${port}`))
