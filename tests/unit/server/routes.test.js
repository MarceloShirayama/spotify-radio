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
    const filename = 'index.html'
    const expectedType = '.' + filename.split('.').pop()
    console.log('expectedType', expectedType)
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

  it.todo('GET /file.ext - should response with file stream')

  it.todo(
    'POST /unknown - given an inexistent route it should response with 404'
  )

  describe('exceptions', () => {
    it.todo('given inexistent file it should respond with 404')

    it.todo('given an error it should respond with 500')
  })
})
