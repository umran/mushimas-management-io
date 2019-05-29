const { Definition } = require('mushimas-models')
const { getBucketDefinitions, getDefinition, validateDisableDefinition } = require('./utils')
const { ResourceError } = require('../errors')

const validateDelete = async (bucketId, _id) => {
  const definitions = await getBucketDefinitions(bucketId)

  const definition = getDefinition(definitions, _id)

  if (!definition) {
    throw new ResourceError('notFound', `A definition with id: ${_id} could not be found in bucket with id: ${bucketId}`)
  }

  // validate the definition
  return validateDisableDefinition(definitions, definition)
}

const commitDelete = async (bucketId, _id) => {
  const matchCondition = {
    _id,
    '@bucketId': bucketId,
    '@state': { $ne: 'DELETED' }
  }

  const deletedDefinition = await Definition.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'DELETED',
      '@lastModified': new Date()
    }
  }, { new: true, lean: true })

  if (!deletedDefinition) {
    throw new ResourceError('notFound', `A definition with id: ${_id} could not be found in bucket with id: ${bucketId}`)
  }

  const details = {
    _id: deletedDefinition._id,
    name: deletedDefinition['@definition'].name,
    class: deletedDefinition['@definition'].class
  }

  return details
}

module.exports = async ({ environment, args }) => {
  const { bucket } = environment
  const { _id } = args
  
  const { schemas, collectionMapping } = await validateDelete(bucket.id, _id)

  const definition = await commitDelete(bucket.id, _id)

  return { definition, collectionMapping, schemas }
}