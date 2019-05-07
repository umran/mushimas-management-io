const { validateSchemas } = require('mushimas').validator
const { Definition } = require('mushimas-models')

const _parseDefinition = definition => {
  const _class = definition.class
  const fields = definition.fields

  const parsedFields = fields.reduce((parsed, field) => {
    parsed[field.name] = field.options

    return parsed
  }, {})

  return {
    class: _class,
    fields: {
      ...parsedFields
    }
  }
}

const _getExistingConfig = async (bucketId) => {
  let definitions = await Definition.find({ '@state': 'ENABLED', '@bucketId': bucketId }, { _id: 1, '@definition': 1 }).lean()

  return definitions.reduce((config, definition) => {
    config[definition['@definition'].name] = _parseDefinition(definition['@definition'])

    return config
  }, {})
}

const _constructConfig = (existingConfig, definition) => {
  return {
    ...existingConfig,
    [definition.name]: _parseDefinition(definition)
  }
}

const _ensureUnique = (existingConfig, definition) => {
  Object.keys(existingConfig).forEach(key => {
    if (key === definition.name) {
      throw new Error('duplicate definition names are not allowed')
    }
  })
}

const _validateDefinition = async (bucketId, definition) => {
  let existingConfig = await _getExistingConfig(bucketId)

  _ensureUnique(existingConfig, definition)

  let newConfig = _constructConfig(existingConfig, definition)

  validateSchemas(newConfig)
}

const _commitDefinition = async (bucketId, definition, ackTime, session) => {
  let options

  if(session) {
    options = { session }
  }

  let newDefinition = await Definition.create([{
    '@state': 'ENABLED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@version': 0,
    '@bucketId': bucketId,
    '@definition': definition
  }], options)

  return newDefinition._id.toString()
}

module.exports = async ({ environment, definition, ackTime, session }) => {
  const { bucket } = environment

  await _validateDefinition(bucket.id, definition)
  
  return await _commitDefinition(bucket.id, definition, ackTime, session)
}