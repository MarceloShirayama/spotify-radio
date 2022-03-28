import { beforeEach, describe, expect, jest } from '@jest/globals'
import fs from 'fs'
import fsPromisees from 'fs/promises'
import { join } from 'path'
import { config } from '../../../server/config'
import { Service } from '../../../server/service'
import { TestUtil } from '../util/testUtil'

describe('#Service - test suite for core processing', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('#createFileStream', () => {
    const currentReadableStream = TestUtil.generateReadableStream(['test'])

    jest
      .spyOn(fs, fs.createReadStream.name)
      .mockReturnValueOnce(currentReadableStream)

    const service = new Service()
    const fakeFile = 'file.mp3'

    const result = service.createFileStream(fakeFile)

    expect(result).toStrictEqual(currentReadableStream)
    expect(fs.createReadStream).toHaveBeenCalledWith(fakeFile)
  })

  it('#getFileInfo', async () => {
    const currentFile = 'file.mp3'

    jest
      .spyOn(fsPromisees, fsPromisees.access.name)
      .mockImplementationOnce(() => {})

    const service = new Service()
    const result = await service.getFileInfo(currentFile)

    const expectedResult = {
      type: '.' + currentFile.split('.').pop(),
      name: join(config.dir.public, currentFile)
    }

    expect(result).toStrictEqual(expectedResult)
  })

  it.todo('#getFileStream')
})
