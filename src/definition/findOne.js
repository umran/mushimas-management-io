const { Definition } = require('mushimas-models')

module.exports = async ({ environment, args }) => {
  const { bucket } = environment
  const { _id } = args

  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucket.id,
    _id
  }

  const definition = await Definition.findOne(matchCondition).lean()

  const extracted = {
    ...definition['@definition'],
    _id: definition._id.toString(),
    _state: definition['@state'],
    _lastModified: definition['@lastModified']
  }
  
  return extracted
}