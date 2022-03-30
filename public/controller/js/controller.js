export class Controller {
  constructor({ view, service }) {
    this.view = view
    this.service = service
  }

  static initialize(deps) {
    return new Controller(deps)
  }
}
