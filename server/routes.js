import { config } from './config.js'
import { Controller } from './controller.js'
import { Service } from './service.js'
import { logger } from './util.js'

const service = new Service()
const controller = new Controller(service)

async function routes(req, res) {
  const { method, url } = req

  if (method === 'GET' && url === '/') {
    res.writeHead(302, { Location: config.location.home })
    return res.end()
  }

  if (method === 'GET' && url === '/home') {
    const { stream } = await controller.getFileStream(config.pages.home)
    return stream.pipe(res)
  }

  if (method === 'GET' && url === '/controller') {
    const { stream } = await controller.getFileStream(config.pages.controller)
    return stream.pipe(res)
  }

  if (method === 'GET') {
    const { stream, type } = await controller.getFileStream(url)
    return stream.pipe(res)
  }

  res.writeHead(404)

  return res.end()
}

function handleError(err, res) {
  if (err.message.includes('ENOENT')) {
    logger.warn(`assets not found: ${err.stack}`)
    res.writeHead(404)
    return res.end()
  }
  logger.error(`caught error on API: ${err.stack}`)
  res.writeHead(500)
  res.end()
}

export async function handler(req, res) {
  try {
    return await routes(req, res)
  } catch (err) {
    handleError(err, res)
  }
}
