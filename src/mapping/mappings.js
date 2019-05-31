module.exports = {
  properties: {
    '@document': {
      type: 'text',
      index: true
    },
    '@draft': {
      type: 'text',
      index: true
    },
    '@collectionId': {
      type: 'keyword',
      index: true
    },
    '@bucketId': {
      type: 'keyword',
      index: true
    },
    '@state': {
      type: 'keyword',
      index: true
    },
    '@draftPublished': {
      type: 'boolean',
      index: true
    },
    '@lastModified': {
      type: 'date',
      index: true
    }
  }
}