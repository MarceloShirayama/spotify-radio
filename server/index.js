import { server } from './server.js'
import { logger } from './util.js'

const port = 3000

server
  .listen(port)
  .on('listening', () => logger.info(`Sever run at http://localhost:${port}`))
