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

const commitEnable = async (bucketId, _id, ackTime, session) => {
  let options

  if(session) {
    options = { session }
  }

  const matchCondition = {
    _id,
    '@bucketId': bucketId,
    '@state': { $ne: 'DELETED' }
  }

  const enabledDefinition = await Definition.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'ENABLED',
      '@lastModified': ackTime,
      '@lastCommitted': new Date(),
    },
    $inc: {
      '@version': 1
    }
  }, options)

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

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket } = environment
  const { _id } = args
  
  const { configuration, collectionMapping } = await validateEnable(bucket.id, _id)

  const definition = await commitEnable(bucket.id, _id, ackTime, session)

  return { bucket, definition, collectionMapping: appendCollectionMapping(collectionMapping, definition), configuration }
}