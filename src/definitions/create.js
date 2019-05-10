const { Definition } = require('mushimas-models')
const { getBucketDefinitions, ensureUniqueDefinition, validateDefinition } = require('./utils')

const validateCreate = async (bucketId, definition) => {
  const definitions = await getBucketDefinitions(bucketId)

  // make sure the definition name is unique across all existing definitions
  ensureUniqueDefinition(definitions, definition)

  // validate the definition
  validateDefinition(definitions, definition)
}

const commitCreate = async (bucketId, definition, ackTime, session) => {
  let options

  if(session) {
    options = { session }
  }

  const newDefinition = await Definition.create([{
    '@state': 'ENABLED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@version': 0,
    '@bucketId': bucketId,
    '@definition': definition
  }], options)

  return newDefinition[0]._id.toString()
}

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket } = environment
  
  await validateCreate(bucket.id, args)

  return await commitCreate(bucket.id, args, ackTime, session)
}