import { logger } from './util.js'

export class Controller {
  constructor(service) {
    this.service = service
  }

  async getFileStream(filename) {
    return this.service.getFileStream(filename)
  }

  async handleCommand({ command }) {
    const result = { result: 'ok' }
    logger.info(`Received command: ${command}`)
    const cmd = command.toLowerCase()
    if (cmd.includes('start')) {
      this.service.startStreaming()
      return result
    }
    if (cmd.includes('stop')) {
      this.service.stopStreaming()
      return result
    }
    const chosenFx = await this.service.readFxByName(cmd)
    logger.info(`Chosen fx song: ${chosenFx}`)
    this.service.appendFxStream(chosenFx)

    return result
  }

  createClientStream() {
    const { id, clientStream } = this.service.createClientStream()

    const onClose = () => {
      logger.info(`Client stream ${id} closed`)
      this.service.removeClientStream(id)
    }

    return { stream: clientStream, onClose }
  }
}
