import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { Controller } from '../../../server/controller'
import { Service } from '../../../server/service'
import { TestUtil } from '../util/testUtil'

describe('#Controller - test suite for controller calls', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('#getFileStream', async () => {
    const mockFilename = 'test.html'
    const mockType = '.' + mockFilename.split('.').pop()

    const mockStream = TestUtil.generateReadableStream(['test'])
    jest
      .spyOn(Service.prototype, Service.prototype.getFileStream.name)
      .mockResolvedValue({ stream: mockStream, type: mockType })

    const service = new Service()
    const controller = new Controller(service)

    const { stream, type } = await controller.getFileStream(mockFilename)

    expect(stream).toStrictEqual(mockStream)
    expect(type).toStrictEqual(mockType)
  })

  it('createClientStream', async () => {
    const mockStream = TestUtil.generateReadableStream(['test'])
    const mockId = '123'

    jest
      .spyOn(Service.prototype, Service.prototype.removeClientStream.name)
      .mockReturnValue({})
    jest
      .spyOn(Service.prototype, Service.prototype.createClientStream.name)
      .mockReturnValue({ id: mockId, clientStream: mockStream })

    const service = new Service()
    const controller = new Controller(service)
    const { stream, onClose } = controller.createClientStream()

    onClose()

    expect(stream).toStrictEqual(mockStream)
    expect(service.removeClientStream).toHaveBeenCalledWith(mockId)
    expect(service.createClientStream).toHaveBeenCalled()
  })

  describe('handleCommand', () => {
    it('command stop', () => {
      jest
        .spyOn(Service.prototype, Service.prototype.stopStreaming.name)
        .mockImplementationOnce()

      const service = new Service()
      const controller = new Controller(service)
      const command = { command: 'stop' }
      const expectedResponse = { result: 'ok' }

      const response = controller.handleCommand(command)

      expect(response).toStrictEqual(expectedResponse)
    })

    it('command start', () => {
      jest
        .spyOn(Service.prototype, Service.prototype.startStreaming.name)
        .mockImplementationOnce()

      const service = new Service()
      const controller = new Controller(service)
      const cmd = { command: 'start' }
      const expectedResponse = { result: 'ok' }

      const response = controller.handleCommand(cmd)

      expect(response).toStrictEqual(expectedResponse)
    })

    it('non existing command', () => {
      jest
        .spyOn(Service.prototype, Service.prototype.startStreaming.name)
        .mockImplementationOnce()

      const service = new Service()
      const controller = new Controller(service)
      const cmd = { command: 'non existing command' }

      const response = controller.handleCommand(cmd)
      const expectedResponse = {
        result: 'error',
        message: `Unknown command: ${cmd.command}`
      }

      expect(response).toStrictEqual(expectedResponse)
      expect(service.startStreaming).toHaveBeenCalledTimes(0)
    })
  })
})
