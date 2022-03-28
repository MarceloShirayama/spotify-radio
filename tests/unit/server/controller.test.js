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
})
