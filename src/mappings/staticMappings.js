module.exports = {
  '@state': {
    type: 'keyword',
    index: true
  },
  '@version': {
    type: 'integer',
    index: true
  },
  '@lastModified': {
    type: 'date',
    index: true
  },
  '@lastCommitted': {
    type: 'date',
    index: true
  }
}