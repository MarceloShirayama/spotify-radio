import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import childProcess from 'child_process'
import fs from 'fs'
import fsPromisees from 'fs/promises'
import { join } from 'path'
import { PassThrough, Writable } from 'stream'
import streamsPromises from 'stream/promises'
import Throttle from 'throttle'
import { config } from '../../../server/config'
import { Service } from '../../../server/service'
import { TestUtil } from '../util/testUtil'

const getSpawnResponse = ({ stdout = '', stderr = '', stdin = () => {} }) => ({
  stdout: TestUtil.generateReadableStream([stdout]),
  stderr: TestUtil.generateReadableStream([stderr]),
  stdin: TestUtil.generateWritableStream(stdin)
})

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

  it('#getFileStream', async () => {
    const currentFile = 'file.mp3'
    const currentFileFullPath = join(config.dir.public, currentFile)
    const fileInfo = {
      type: '.' + currentFile.split('.').pop(),
      name: currentFileFullPath
    }
    const currentReadableStream = TestUtil.generateReadableStream(['test'])

    const service = new Service()

    jest.spyOn(service, service.getFileInfo.name).mockReturnValueOnce(fileInfo)
    jest
      .spyOn(service, service.createFileStream.name)
      .mockReturnValueOnce(currentReadableStream)

    const result = await service.getFileStream(currentFile)
    const expectedResult = {
      type: fileInfo.type,
      stream: currentReadableStream
    }

    expect(result).toStrictEqual(expectedResult)
  })

  it('#removeClientStream', () => {
    const service = new Service()
    const mockId = '123'

    jest
      .spyOn(service.clientStreams, service.clientStreams.delete.name)
      .mockImplementationOnce(() => {})

    service.removeClientStream(mockId)

    expect(service.clientStreams.delete).toHaveBeenCalledWith(mockId)
  })

  it('#createClientStream', () => {
    const service = new Service()

    jest
      .spyOn(service.clientStreams, service.clientStreams.set.name)
      .mockImplementationOnce()

    const { id, clientStream } = service.createClientStream()

    expect(service.clientStreams.set).toHaveBeenCalledWith(id, clientStream)
    expect(id).toBeDefined()
    expect(id.length).toBeGreaterThan(0)
    expect(clientStream).toBeDefined()
    expect(clientStream).toBeInstanceOf(PassThrough)
  })

  it('##stopStreaming - existing throttleTransform', () => {
    const service = new Service()
    service.throttleTransform = new Throttle(1)

    jest.spyOn(service.throttleTransform, 'end').mockImplementation()

    service.stopStreaming()

    expect(service.throttleTransform.end).toHaveBeenCalled()
  })

  it('##stopStreaming - non existing throttleTransform', () => {
    const service = new Service()

    expect(service.throttleTransform).toStrictEqual({})
    expect(() => service.stopStreaming()).not.toThrow()
  })

  it('#broadCast - it should write only for active client streams', () => {
    const service = new Service()
    const onData = jest.fn()
    const client1 = TestUtil.generateWritableStream(onData)
    const client2 = TestUtil.generateWritableStream(onData)

    jest.spyOn(service.clientStreams, service.clientStreams.delete.name)
    // .mockImplementationOnce()

    service.clientStreams.set('1', client1)
    service.clientStreams.set('2', client2)
    client2.end()

    const writable = service.broadcast()
    // will send only to client1 because the other one disconnected
    writable.write('test')

    expect(writable).toBeInstanceOf(Writable)
    expect(onData).toHaveBeenCalledTimes(1)
    expect(service.clientStreams.delete).toHaveBeenCalledWith('2')
  })

  it('#getBitRate - it should return the bitRate as string', async () => {
    const file = 'file.mp3'
    const service = new Service()
    const fakeSpawnResponse = getSpawnResponse({ stdout: '1k' })

    jest
      .spyOn(service, service._executeSoxCommand.name)
      .mockReturnValueOnce(fakeSpawnResponse)

    const bitRate = await service.getBitRate(file)
    const expectedBitRateReturn = '1000'

    expect(typeof bitRate).toBe('string')
    expect(bitRate).toBe(expectedBitRateReturn)
    expect(service._executeSoxCommand).toHaveBeenCalledWith([
      '--info',
      '-B',
      file
    ])
  })

  it(`##getBitRate - when an error occurs, you should get the default Bit Rate
    `, async () => {
    const file = 'file.mp3'
    const service = new Service()
    const spawnResponse = getSpawnResponse({ stderr: 'error!' })

    jest
      .spyOn(service, service._executeSoxCommand.name)
      .mockReturnValueOnce(spawnResponse)

    const bitRate = await service.getBitRate(file)

    expect(bitRate).toStrictEqual(config.audioSetup.bitRate)
  })

  it('##_executeSoxCommand - it should call the sox command', () => {
    const service = new Service()
    const spawnResponse = getSpawnResponse({ stdout: '1k' })
    const args = ['any', 'args']

    jest
      .spyOn(childProcess, childProcess.spawn.name)
      .mockReturnValueOnce(spawnResponse)

    const cmd = service._executeSoxCommand(args)

    expect(cmd).toStrictEqual(spawnResponse)
    expect(childProcess.spawn).toHaveBeenCalledWith('sox', args)
  })

  it('##startStreaming - it should call the sox command', async () => {
    const currentFile = 'file.mp3'
    const service = new Service()
    service.currentSong = currentFile
    const currentReadable = TestUtil.generateReadableStream(['test'])
    const writableBroadCaster = TestUtil.generateWritableStream(() => {})
    const expectedResult = 'ok'

    jest
      .spyOn(service, service.getBitRate.name)
      .mockReturnValueOnce(config.audioSetup.bitRate)

    jest
      .spyOn(streamsPromises, streamsPromises.pipeline.name)
      .mockResolvedValueOnce(expectedResult)

    jest
      .spyOn(fs, fs.createReadStream.name)
      .mockReturnValueOnce(currentReadable)

    jest
      .spyOn(service, service.broadcast.name)
      .mockReturnValueOnce(writableBroadCaster)

    const expectThrottleTransform =
      config.audioSetup.bitRate / config.audioSetup.bitRateDivisor

    const result = await service.startStreaming()

    expect(service.currentBitRate).toBe(expectThrottleTransform)
    expect(result).toStrictEqual(expectedResult)
    expect(service.getBitRate).toHaveBeenCalledWith(currentFile)
    expect(fs.createReadStream).toHaveBeenCalledWith(currentFile)
    // expect(streamsPromises.pipeline).toHaveBeenCalledWith(
    //   currentReadable,
    //   service.throttleTransform,
    //   service.broadcast()
    // )
  })
})
