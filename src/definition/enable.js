const { Definition } = require('mushimas-models')
const { getBucketDefinitions, getDefinition, appendCollectionMapping, validateEnableDefinition } = require('./utils')
const { ResourceError } = require('../errors')

const validateEnable = async (bucketId, _id) => {
  const definitions = await getBucketDefinitions(bucketId)

  const definition = getDefinition(definitions, _id)

  if (!definition) {
    throw new ResourceError('notFound', `A definition with id: ${_id} could not be found in bucket with id: ${bucketId}`)
  }

  // validate the definition
  return validateEnableDefinition(definitions, definition)
}

const commitEnable = async (bucketId, _id) => {
  const matchCondition = {
    _id,
    '@bucketId': bucketId,
    '@state': { $ne: 'DELETED' }
  }

  const enabledDefinition = await Definition.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'ENABLED',
      '@lastModified': new Date()
    }
  }, { new: true, lean: true })

  if (!enabledDefinition) {
    throw new ResourceError('notFound', `A definition with id: ${_id} could not be found in bucket with id: ${bucketId}`)
  }

  const details = {
    _id: enabledDefinition._id,
    name: enabledDefinition['@definition'].name,
    class: enabledDefinition['@definition'].class
  }

  return details
}

module.exports = async ({ environment, args }) => {
  const { bucket } = environment
  const { _id } = args
  
  const { schemas, collectionMapping } = await validateEnable(bucket.id, _id)

  const definition = await commitEnable(bucket.id, _id)

  return { definition, collectionMapping: appendCollectionMapping(collectionMapping, definition), schemas }
}