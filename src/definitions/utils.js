const { validateSchema, validateReferences, validateEmbedded } = require('mushimas').validator
const { Definition } = require('mushimas-models')
const { ValidationError } = require('../errors')

const exists = (arr, lambda) => {
  for (let i = 0; i < arr.length; i++) {
    if (lambda(arr[i]) === true) {
      return true
    }
  }

  return false
}

const find = (arr, lambda) => {
  for (let i = 0; i < arr.length; i++) {
    if (lambda(arr[i]) === true) {
      return [arr[i], i]
    }
  }

  return []
}

const parseDefinition = (definition, excludeDisabled=true) => {
  const _class = definition.class
  const fields = definition.fields

  const parsedFields = fields.reduce((parsed, field) => {
    if (field.options.type === 'array') {
      if (field.options.item.enabled === false) {
        if (excludeDisabled === false) {
          parsed[field.name] = field.options
        }
      } else {
        parsed[field.name] = field.options
      }
    } else if (field.options.enabled === false) {
      if (excludeDisabled === false) {
        parsed[field.name] = field.options
      }
    } else {
      parsed[field.name] = field.options
    }

    return parsed
  }, {})

  return {
    class: _class,
    fields: {
      ...parsedFields
    }
  }
}

const getBucketDefinitions = async bucketId => {
  const definitions = await Definition.find({ '@state': { $ne: 'DELETED' }, '@bucketId': bucketId }, { _id: 1, '@definition': 1, '@state': 1 }).lean()

  return definitions.map(definition => {
    return {
      _id: definition._id.toString(),
      state: definition['@state'],
      ...definition['@definition']
    }
  })
}

const ensureUniqueDefinition = (definitions, definition) => {
  definitions.forEach(def => {
    if (def.name === definition.name) {
      throw new ValidationError('alreadyExistsDefinition', `the definition: ${definition.name} already exists`)
    }
  })
}

const getDefinition = (definitions, _id) => {
  const matching = definitions.filter(def => def._id === _id)

  if (matching.length > 0) {
    return matching[0]
  }
}

const getEnabledDefinitions = definitions => {
  return definitions.filter(definition => definition.state === 'ENABLED')
}

const getRemainingEnabledDefinitions = (definitions, excludedDefinition) => {
  return definitions.filter(definition => definition.state === 'ENABLED' && definition._id !== excludedDefinition._id)
}

const compileConfig = (relevantDefinitions) => {
  return relevantDefinitions.reduce((config, definition) => {
    config[definition.name] = parseDefinition(definition)

    return config
  }, {})
}

const appendConfig = (currentConfig, definition) => {
  return {
    ...currentConfig,
    [definition.name]: parseDefinition(definition)
  }
}

const validateDefinition = (definitions, definition) => {
  // independently validate the definition
  const rawSchema = parseDefinition(definition, false)
  
  try {
    validateSchema(rawSchema)
  } catch (err) {
    throw new ValidationError('invalidFormat', 'the definition does not conform to the expected format')
  }

  // get all enabled definitions
  const enabledDefinitions = getEnabledDefinitions(definitions)

  // compile all enabled definitions
  const currentConfig = compileConfig(enabledDefinitions)

  // append the definition to be validated to the compiled config
  const newConfig = appendConfig(currentConfig, definition)

  // validate the new config
  try {
    validateReferences(newConfig)  
  } catch(err) {
    throw new ValidationError('nullReference', 'fields referencing non-existent or disabled definitions cannot be enabled')
  }
  
  try {
    validateEmbedded(newConfig)
  } catch(err) {
    throw new ValidationError('embeddedCircularReference', 'circular references between embedded definitions are not allowed')
  }

  return newConfig
}

const validateEnableDefinition = (definitions, definition) => {
  // get all enabled definitions
  const enabledDefinitions = getEnabledDefinitions(definitions)

  // compile all enabled definitions
  const currentConfig = compileConfig(enabledDefinitions)

  // append the definition to be validated to the compiled config
  const newConfig = appendConfig(currentConfig, definition)

  // validate the new config
  try {
    validateReferences(newConfig)  
  } catch(err) {
    throw new ValidationError('nullReference', 'fields referencing non-existent or disabled definitions cannot be enabled')
  }
  
  try {
    validateEmbedded(newConfig)
  } catch(err) {
    throw new ValidationError('embeddedCircularReference', 'circular references between embedded definitions are not allowed')
  }

  return newConfig
}

const validateDisableDefinition = (definitions, definition) => {
  // get all enabled definitions except the definition to be disabled
  const remainingEnabledDefinitions = getRemainingEnabledDefinitions(definitions, definition)

  // compile all remaining enabled definitions
  const newConfig = compileConfig(remainingEnabledDefinitions)

  // validate the new config
  try {
    validateReferences(newConfig)  
  } catch(err) {
    throw new ValidationError('nullReference', 'fields referencing non-existent or disabled definitions cannot be enabled')
  }
  
  try {
    validateEmbedded(newConfig)
  } catch(err) {
    throw new ValidationError('embeddedCircularReference', 'circular references between embedded definitions are not allowed')
  }

  return newConfig
}

module.exports = {
  exists,
  find,
  getBucketDefinitions,
  getDefinition,
  ensureUniqueDefinition,
  validateDefinition,
  validateEnableDefinition,
  validateDisableDefinition
}