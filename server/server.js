import { createServer } from 'http'
import { handler } from './routes.js'

export const serverInstance = createServer(handler)
