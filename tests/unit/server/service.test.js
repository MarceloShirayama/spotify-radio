import { beforeEach, describe, expect, jest } from '@jest/globals'
import fs from 'fs'
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

  it.todo('#getFileInfo')

  it.todo('#getFileStream')
})
