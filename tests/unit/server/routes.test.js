import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { config } from '../../../server/config'
import { Controller } from '../../../server/controller'
import { handler } from '../../../server/routes'
import { TestUtil } from '../util/testUtil'

describe('#Routes - test site from API response', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('GET / - should redirect to home page', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/'

    await handler(...params.values())

    expect(params.response.writeHead).toHaveBeenCalledWith(302, {
      Location: config.location.home
    })
  })

  it(`GET /home - should response with ${config.pages.home} file stream
  `, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/home'

    const mockFileStream = TestUtil.generateReadableStream(['test'])
    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockReturnValueOnce({ stream: mockFileStream })
    jest.spyOn(mockFileStream, 'pipe').mockImplementationOnce(() => {})

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(
      config.pages.home
    )
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
  })

  it(`GET /controller - should response with ${config.pages.controller} 
    file stream
  `, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/controller'

    const mockFileStream = TestUtil.generateReadableStream(['test'])
    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockReturnValueOnce({ stream: mockFileStream })
    jest.spyOn(mockFileStream, 'pipe').mockImplementationOnce(() => {})

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(
      config.pages.controller
    )
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
  })

  it('GET /index.html - should response with file stream', async () => {
    const params = TestUtil.defaultHandleParams()
    const filename = '/index.html'
    const expectedType = '.' + filename.split('.').pop()
    params.request.method = 'GET'
    params.request.url = filename

    const mockFileStream = TestUtil.generateReadableStream(['test'])
    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockReturnValueOnce({ stream: mockFileStream, type: expectedType })
    jest.spyOn(mockFileStream, 'pipe').mockImplementationOnce(() => {})

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': config.contentType[expectedType]
    })
  })

  it('GET /file.ext - should response with file stream', async () => {
    const params = TestUtil.defaultHandleParams()
    const filename = '/file.ext'
    const expectedType = '.' + filename.split('.').pop()
    params.request.method = 'GET'
    params.request.url = filename

    const mockFileStream = TestUtil.generateReadableStream(['test'])
    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockReturnValueOnce({ stream: mockFileStream, type: expectedType })
    jest.spyOn(mockFileStream, 'pipe').mockImplementationOnce(() => {})

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).not.toHaveBeenCalled()
  })

  it(`
    POST /unknown - given an inexistent route it should response with 404
    `, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'POST'
    params.request.url = '/unknown'

    await handler(...params.values())

    expect(params.response.writeHead).toHaveBeenCalledWith(404)
    expect(params.response.end).toHaveBeenCalled()
  })

  describe('exceptions', () => {
    it('given inexistent file it should respond with 404', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/inexistent.ext'

      jest
        .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockImplementationOnce(() => {
          throw new Error('ENOENT')
        })

      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(404)
      expect(params.response.end).toHaveBeenCalled()
    })

    it('should returns 500 if any other error occurs', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/inexistent.ext'

      jest
        .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockImplementationOnce(() => {
          throw new Error('Error')
        })

      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(500)
      expect(params.response.end).toHaveBeenCalled()
    })
  })
})
