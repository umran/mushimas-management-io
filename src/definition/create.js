const { Definition } = require('mushimas-models')
const { getBucketDefinitions, appendCollectionMapping, validateDefinition } = require('./utils')

const validateCreate = async (bucketId, definition) => {
  const definitions = await getBucketDefinitions(bucketId)

  // validate the definition
  return validateDefinition(definitions, definition)
}

const commitCreate = async (bucketId, definition) => {

  let options = {
    upsert: true,
    new: true
  }

  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucketId,
    '@definition.name': definition.name,
  }

  const newDefinition = await Definition.findOneAndUpdate(matchCondition, {
    '@definition': definition,
    '@state': 'ENABLED',
    '@lastModified': new Date(),
    '@bucketId': bucketId
  }, options)

  const details = {
    _id: newDefinition._id,
    name: newDefinition['@definition'].name,
    class: newDefinition['@definition'].class
  }

  return details
}

module.exports = async ({ environment, args }) => {
  const { bucket } = environment

  const { schemas, collectionMapping } = await validateCreate(bucket.id, args)

  const definition = await commitCreate(bucket.id, args)

  return { bucket, definition, collectionMapping: appendCollectionMapping(collectionMapping, definition), schemas }
}