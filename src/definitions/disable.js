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
  const updatedConfig = validateDisableDefinition(definitions, definition)

  return updatedConfig
}

const commitDisable = async (bucketId, _id, ackTime, session) => {

  let options

  if(session) {
    options = { session }
  }

  const matchCondition = {
    _id,
    '@bucketId': bucketId,
    '@state': { $ne: 'DELETED' }
  }

  const disabledDefinition = await Definition.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'DISABLED',
      '@lastModified': ackTime,
      '@lastCommitted': new Date(),
    },
    $inc: {
      '@version': 1
    }
  }, options)

  if (!disabledDefinition) {
    throw new ResourceError('notFound', `A definition with id: ${_id} could not be found in bucket with id: ${bucketId}`)
  }

  const details = {
    id: disabledDefinition._id,
    name: disabledDefinition['@definition'].name,
    class: disabledDefinition['@definition'].class
  }

  return details
}

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket } = environment
  const { _id } = args
  
  const updatedConfig = await validateDisable(bucket.id, _id)

  const definition = await commitDisable(bucket.id, _id, ackTime, session)

  return { bucket, definition, updatedConfig }
}