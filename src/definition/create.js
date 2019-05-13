const { Definition } = require('mushimas-models')
const { getBucketDefinitions, appendCollectionMapping, validateDefinition } = require('./utils')

const validateCreate = async (bucketId, definition) => {
  const definitions = await getBucketDefinitions(bucketId)

  // validate the definition
  return validateDefinition(definitions, definition)
}

const commitCreate = async (bucketId, definition, ackTime, session) => {

  let options = {
    upsert: true,
    new: true
  }

  if(session) {
    options = {
      ...options,
      session
    }
  }

  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucketId,
    '@definition.name': definition.name,
  }

  const newDefinition = await Definition.findOneAndUpdate(matchCondition, {
    '@definition': definition,
    '@state': 'ENABLED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@bucketId': bucketId,
    '@version': 0
  }, options)

  const details = {
    _id: newDefinition._id,
    name: newDefinition['@definition'].name,
    class: newDefinition['@definition'].class
  }

  return details
}

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket } = environment

  const { configuration, collectionMapping } = await validateCreate(bucket.id, args)

  const definition = await commitCreate(bucket.id, args, ackTime, session)

  return { bucket, definition, collectionMapping: appendCollectionMapping(collectionMapping, definition), configuration }
}