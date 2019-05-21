const { Definition } = require('mushimas-models')
const { getBucketDefinitions, getDefinition, validateDisableDefinition } = require('./utils')
const { ResourceError } = require('../errors')

const validateDisable = async (bucketId, _id) => {
  const definitions = await getBucketDefinitions(bucketId)

  const definition = getDefinition(definitions, _id)

  if (!definition) {
    throw new ResourceError('notFound', `A definition with id: ${_id} could not be found in bucket with id: ${bucketId}`)
  }

  // validate the definition
  return validateDisableDefinition(definitions, definition)
}

const commitDisable = async (bucketId, _id) => {
  const matchCondition = {
    _id,
    '@bucketId': bucketId,
    '@state': { $ne: 'DELETED' }
  }

  const disabledDefinition = await Definition.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'DISABLED',
      '@lastModified': new Date()
    }
  })

  if (!disabledDefinition) {
    throw new ResourceError('notFound', `A definition with id: ${_id} could not be found in bucket with id: ${bucketId}`)
  }

  const details = {
    _id: disabledDefinition._id,
    name: disabledDefinition['@definition'].name,
    class: disabledDefinition['@definition'].class
  }

  return details
}

module.exports = async ({ environment, args }) => {
  const { bucket } = environment
  const { _id } = args
  
  const { schemas, collectionMapping } = await validateDisable(bucket.id, _id)

  const definition = await commitDisable(bucket.id, _id)

  return { definition, collectionMapping, schemas }
}