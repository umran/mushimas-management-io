class GenericError extends Error {
  constructor(code, message) {
    super()
    this.message = `${code}: ${message}`
  }
}

class ResourceError extends GenericError {}
class ValidationError extends GenericError {}

module.exports = {
  ResourceError,
  ValidationError
}