const { Definition } = require('mushimas-models')
const { generateHash } = require('mushimas-crypto')
const { getBucketDefinitions, ensureUniqueDefinition, validateDefinition } = require('./utils')

const validateCreate = async (bucketId, definition) => {
  const definitions = await getBucketDefinitions(bucketId)

  // make sure the definition name is unique across all existing definitions
  ensureUniqueDefinition(definitions, definition)

  // validate the definition
  const updatedConfig = validateDefinition(definitions, definition)

  return updatedConfig
}

const commitCreate = async (bucketId, definition, idempotencyKey, ackTime, session) => {
  const initialHash = generateHash(JSON.stringify(definition))

  let options = {
    upsert: true
  }

  if(session) {
    options = {
      ...options,
      session
    }
  }

  const matchCondition = {
    '@bucketId': bucketId,
    '@idempotencyKey': idempotencyKey,
    '@initialHash': initialHash
  }

  const newDefinition = await Definition.findOneAndUpdate(matchCondition, {
    '@definition': definition,
    '@state': 'ENABLED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@bucketId': bucketId,
    '@idempotencyKey': idempotencyKey,
    '@initialHash': initialHash,
    '@version': 0
  }, options)

  const details = {
    id: newDefinition._id,
    name: newDefinition['@definition'].name,
    class: newDefinition['@definition'].class
  }

  return details
}

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket, idempotencyKey } = environment

  const updatedConfig = await validateCreate(bucket.id, args)

  const definition = await commitCreate(bucket.id, args, idempotencyKey, ackTime, session)

  return { bucket, definition, updatedConfig }
}