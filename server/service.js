import childProcess from 'child_process'
import { randomUUID } from 'crypto'
import { once } from 'events'
import fs from 'fs'
import fsPromises from 'fs/promises'
import { extname, join } from 'path'
import { PassThrough, Writable } from 'stream'
import streamsPromises from 'stream/promises'
import Throttle from 'throttle'
import { config } from './config.js'
import { logger } from './util.js'

export class Service {
  constructor() {
    this.clientStreams = new Map()
    this.currentSong = config.audioSetup.conversation
    this.currentBitRate = 0
    this.throttleTransform = {}
    this.currentReadable = {}
  }

  createClientStream() {
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientStreams.set(id, clientStream)

    return { id, clientStream }
  }

  removeClientStream(id) {
    this.clientStreams.delete(id)
  }

  createFileStream(filename) {
    return fs.createReadStream(filename)
  }

  _executeSoxCommand(args) {
    return childProcess.spawn('sox', args)
  }

  async getBitRate(file) {
    try {
      const args = ['--info', '-B', file]
      const { stderr, stdout } = this._executeSoxCommand(args)
      await Promise.all([once(stderr, 'readable'), once(stdout, 'readable')])
      const [error, success] = [stderr, stdout].map((stream) => stream.read())
      if (error) return await Promise.reject(error)

      return success.toString().trim().replace(/k/, '000')
    } catch (error) {
      logger.error(`Error getting bitrate: ${error}`)

      return config.audioSetup.bitRate
    }
  }

  broadcast() {
    return new Writable({
      write: (chunk, encoding, callback) => {
        for (const [id, stream] of this.clientStreams) {
          if (stream.writableEnded) {
            this.clientStreams.delete(id)
            continue
          }
          stream.write(chunk)
        }
        callback()
      }
    })
  }

  async startStreaming() {
    logger.info(`Starting stream with file: ${this.currentSong}`)
    const bitRate = (this.currentBitRate =
      (await this.getBitRate(this.currentSong)) /
      config.audioSetup.bitRateDivisor)
    const throttleTransform = (this.throttleTransform = new Throttle(bitRate))
    const currentReadable = (this.currentReadable = this.createFileStream(
      this.currentSong
    ))
    return streamsPromises.pipeline(
      currentReadable,
      throttleTransform,
      this.broadcast()
    )
  }

  stopStreaming() {
    this.throttleTransform?.end?.()
  }

  async getFileInfo(file) {
    const fullFilePath = join(config.dir.public, file)
    await fsPromises.access(fullFilePath)
    const fileType = extname(fullFilePath)

    return {
      type: fileType,
      name: fullFilePath
    }
  }

  async getFileStream(file) {
    const { type, name } = await this.getFileInfo(file)

    return {
      stream: this.createFileStream(name),
      type
    }
  }

  async readFxByName(fxName) {
    const fxDir = await fsPromises.readdir(config.dir.fx)
    const chosenSong = fxDir.find((file) => file.toLowerCase().includes(fxName))
    if (!chosenSong) return await Promise.reject(`No song found for ${fxName}`)

    return join(config.dir.fx, chosenSong)
  }

  appendFxStream(fx) {
    const throttleTransformable = new Throttle(this.currentBitRate)
    streamsPromises.pipeline(throttleTransformable, this.broadcast())

    const unpipe = () => {
      const transformStream = this.mergeAudioStreams(fx, this.currentReadable)
      this.throttleTransform = throttleTransformable
      this.currentReadable = transformStream
      this.currentReadable.removeListener('unpipe', unpipe)

      streamsPromises.pipeline(transformStream, throttleTransformable)
    }

    this.throttleTransform.on('unpipe', unpipe)
    this.throttleTransform.pause()
    this.currentReadable.unpipe(this.throttleTransform)
  }

  mergeAudioStreams(song, readable) {
    const transformStream = PassThrough()

    const args = [
      '--type',
      config.audioSetup.mediaType,
      '--volume',
      config.audioSetup.volume,
      '-m',
      '-',
      '--type',
      config.audioSetup.mediaType,
      '--volume',
      config.audioSetup.fxVolume,
      song,
      '--type',
      config.audioSetup.mediaType,
      '-'
    ]

    const { stdout, stdin } = this._executeSoxCommand(args)

    streamsPromises
      .pipeline(readable, stdin)
      .catch((error) =>
        logger.error(`Error on sending stream to sox: ${error}`)
      )
    streamsPromises
      .pipeline(stdout, transformStream)
      .catch((error) =>
        logger.error(`Error on receiving stream from sox: ${error}`)
      )

    return transformStream
  }
}
