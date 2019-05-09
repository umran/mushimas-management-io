const { Definition } = require('mushimas-models')
const { validateSchemas } = require('mushimas').validator
const { getExistingConfig, ensureUnique, constructConfig } = require('./utils')

const validateDefinition = async (bucketId, definition) => {
  let existingConfig = await getExistingConfig(bucketId)

  ensureUnique(existingConfig, definition)

  let newConfig = constructConfig(existingConfig, definition)

  validateSchemas(newConfig)
}

const commitDefinition = async (bucketId, args, ackTime, session) => {
  let options

  if(session) {
    options = { session }
  }

  let newDefinition = await Definition.create([{
    '@state': 'DISABLED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@version': 0,
    '@bucketId': bucketId,
    '@definition': args
  }], options)

  return newDefinition[0]._id.toString()
}

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket } = environment

  await validateDefinition(bucket.id, args)
  
  return await commitDefinition(bucket.id, args, ackTime, session)
}