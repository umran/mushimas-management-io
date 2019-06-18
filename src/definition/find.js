const { Definition } = require('mushimas-models')

module.exports = async ({ environment }) => {
  const { bucket } = environment

  // get all definitions listed under the same bucketId
  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucket.id
  }

  const existingDefinitions = await Definition.find(matchCondition).lean()

  return existingDefinitions.map(definition => {
    let extracted = {
      ...definition['@definition'],
      _id: definition._id.toString(),
      _state: definition['@state'],
      _lastModified: definition['@lastModified']
    }
    
    return extracted
  })
}