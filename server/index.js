import { server } from './server.js'

const port = 3000

server
  .listen(port)
  .on('listening', () => console.log(`Sever run at http://localhost:${port}`))
