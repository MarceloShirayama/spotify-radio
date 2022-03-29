import { describe, expect, it, jest } from '@jest/globals'
import portfinder from 'portfinder'
import { Transform } from 'stream'
import supertest from 'supertest'
import { setTimeout } from 'timers/promises'
import { serverInstance } from '../../../server/server.js'

describe('API E2E Suite Test', () => {
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
