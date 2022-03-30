import { describe, expect, it, jest } from '@jest/globals'
import fs from 'fs'
import { join } from 'path'
import portfinder from 'portfinder'
import { Transform } from 'stream'
import supertest from 'supertest'
import { setTimeout } from 'timers/promises'
import { config } from '../../../server/config.js'
import { serverInstance } from '../../../server/server.js'

describe('API E2E Suite Test', () => {
  let testServer = supertest(serverInstance)

  it(`GET /unknown - given an unknown route it should respond with 404 status 
    code
  `, async () => {
    const response = await testServer.get('/unknown')

    expect(response.statusCode).toBe(404)
  })

  it(`GET / - it should respond with the home location and 302 status code
  `, async () => {
    const response = await testServer.get('/')

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/home')
  })

  it('GET /home - it should respond with file stream', async () => {
    const response = await testServer.get('/home')
    const filePath = join(config.dir.public, config.pages.home)

    const homePage = await fs.promises.readFile(filePath)

    expect(response.text).toStrictEqual(homePage.toString())
  })

  it('GET /controller - it should respond with file stream', async () => {
    const response = await testServer.get('/controller')
    const filePath = join(config.dir.public, config.pages.controller)

    const controllerPage = await fs.promises.readFile(filePath)

    expect(response.text).toStrictEqual(controllerPage.toString())
  })

  describe('static files', () => {
    it(`GET /file.js - it should respond with 404 if file doesn't exists
    `, async () => {
      const file = 'no-exists.ext'
      const response = await testServer.get(`/${file}`)

      expect(response.statusCode).toBe(404)
    })

    it(`GET /controller/css/index.css - given a css file it should respond with 
      content-type text/css
    `, async () => {
      const file = 'controller/css/index.css'
      const filePath = join(config.dir.public, file)
      const response = await testServer.get(`/${file}`)
      const expectedType = '.' + file.split('.').pop()
      const htmlPage = await fs.promises.readFile(filePath)

      expect(response.statusCode).toBe(200)
      expect(response.text).toStrictEqual(htmlPage.toString())
      expect(response.headers['content-type']).toBe(
        config.contentType[expectedType]
      )
    })

    it(`GET /home/js/animation.js - given a js file it should respond with 
      content-type text/javascript
    `, async () => {
      const file = 'home/js/animation.js'
      const filePath = join(config.dir.public, file)
      const response = await testServer.get(`/${file}`)
      const expectedType = '.' + file.split('.').pop()
      const htmlPage = await fs.promises.readFile(filePath)

      expect(response.statusCode).toBe(200)
      expect(response.text).toStrictEqual(htmlPage.toString())
      expect(response.headers['content-type']).toBe(
        config.contentType[expectedType]
      )
    })

    it(`GET /controller/index.html - given a html file it should respond with 
      content-type text/html
    `, async () => {
      const file = config.pages.controller
      const filePath = join(config.dir.public, file)
      const response = await testServer.get(`/${file}`)
      const expectedType = '.' + file.split('.').pop()
      const htmlPage = await fs.promises.readFile(filePath)

      expect(response.statusCode).toBe(200)
      expect(response.text).toStrictEqual(htmlPage.toString())
      expect(response.headers['content-type']).toBe(
        config.contentType[expectedType]
      )
    })
  })

  describe('Client Workflow', () => {
    const RETENTION_DATA_PERIOD = 200
    const commandResponse = JSON.stringify({ result: 'ok' })
    const possibleCommands = {
      start: 'start',
      stop: 'stop'
    }
    const getAvailablePort = portfinder.getPortPromise

    function pipeAndReadStreamData(stream, onChunk) {
      const transform = new Transform({
        transform(chunk, encoding, callback) {
          onChunk(chunk)
          callback(null, chunk)
        }
      })

      return stream.pipe(transform)
    }

    async function getTestServer() {
      const getSupertest = (port) => supertest(`http://localhost:${port}`)
      const port = await getAvailablePort()

      return new Promise((resolve, reject) => {
        const server = serverInstance
          .listen(port)
          .once('listening', () => {
            const testServer = getSupertest(port)
            const response = {
              testServer,
              kill() {
                server.close()
              }
            }
            return resolve(response)
          })
          .once('error', reject)
      })
    }

    function commandSender(testServer) {
      return {
        async send(command) {
          const response = await testServer
            .post('/controller')
            .send({ command })

          expect(response.text).toStrictEqual(commandResponse)
        }
      }
    }

    it('it should not receive data stream if the process is not playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()
      pipeAndReadStreamData(server.testServer.get('/stream'), onChunk)

      await setTimeout(RETENTION_DATA_PERIOD)
      server.kill()

      expect(onChunk).not.toHaveBeenCalled()
    })

    it('it should receive data stream if the process is playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()
      const { send } = commandSender(server.testServer)

      pipeAndReadStreamData(server.testServer.get('/stream'), onChunk)

      await send(possibleCommands.start)
      await setTimeout(RETENTION_DATA_PERIOD)
      await send(possibleCommands.stop)

      const [[buffer]] = onChunk.mock.calls

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(1000)

      server.kill()
    })
  })
})
