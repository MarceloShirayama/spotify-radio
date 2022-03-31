import { Controller } from './controller.js'
import { Service } from './service.js'
import { View } from './view.js'

const url = `${window.location.origin}/controller`
const service = new Service({ url })
const view = new View()
Controller.initialize({ view, service })
