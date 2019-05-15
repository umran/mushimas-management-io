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

const compileSchemas = (relevantDefinitions) => {
  return relevantDefinitions.reduce((schemas, definition) => {
    schemas[definition.name] = parseDefinition(definition)

    return schemas
  }, {})
}

const appendSchemas = (currentSchemas, definition) => {
  return {
    ...currentSchemas,
    [definition.name]: parseDefinition(definition)
  }
}

const getCollectionMapping = definitions => {
  return definitions.reduce((mapping, definition) => {
    if (definition.class === 'collection') {
      mapping[definition.name] = definition._id
    }

    return mapping
  }, {})
}

const appendCollectionMapping = (mappings, definition) => {
  if (definition.class === 'embedded') {
    return mappings
  }

  return {
    ...mappings,
    [definition.name]: definition._id
  }
}

// the validation method used in the create and update methods
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
  const currentSchemas = compileSchemas(enabledDefinitions)

  // append the definition to be validated to the compiled schemas
  const newSchemas = appendSchemas(currentSchemas, definition)

  // validate the new schemas
  try {
    validateReferences(newSchemas)  
  } catch(err) {
    throw new ValidationError('nullReference', 'fields referencing non-existent or disabled definitions cannot be enabled')
  }
  
  try {
    validateEmbedded(newSchemas)
  } catch(err) {
    throw new ValidationError('embeddedCircularReference', 'circular references between embedded definitions are not allowed')
  }

  // generate definition id mappings
  const collectionMapping = getCollectionMapping(enabledDefinitions)

  return { schemas: newSchemas, collectionMapping }
}

// the validation method used in the enable method
const validateEnableDefinition = (definitions, definition) => {
  // get all enabled definitions
  const enabledDefinitions = getEnabledDefinitions(definitions)

  // compile all enabled definitions
  const currentSchemas = compileSchemas(enabledDefinitions)

  // append the definition to be validated to the compiled schemas
  const newSchemas = appendSchemas(currentSchemas, definition)

  // validate the new schemas
  try {
    validateReferences(newSchemas)  
  } catch(err) {
    throw new ValidationError('nullReference', 'fields referencing non-existent or disabled definitions cannot be enabled')
  }
  
  try {
    validateEmbedded(newSchemas)
  } catch(err) {
    throw new ValidationError('embeddedCircularReference', 'circular references between embedded definitions are not allowed')
  }

  // generate definition id mappings
  const collectionMapping = getCollectionMapping(enabledDefinitions)

  return { schemas: newSchemas, collectionMapping }
}

// the validation method used in the disable and delete methods
const validateDisableDefinition = (definitions, definition) => {
  // get all enabled definitions except the definition to be disabled
  const remainingEnabledDefinitions = getRemainingEnabledDefinitions(definitions, definition)

  // compile all remaining enabled definitions
  const newSchemas = compileSchemas(remainingEnabledDefinitions)

  // validate the new schemas
  try {
    validateReferences(newSchemas)
  } catch(err) {
    throw new ValidationError('nullReference', 'fields referencing non-existent or disabled definitions cannot be enabled')
  }
  
  try {
    validateEmbedded(newSchemas)
  } catch(err) {
    throw new ValidationError('embeddedCircularReference', 'circular references between embedded definitions are not allowed')
  }

  // generate definition id mappings
  const collectionMapping = getCollectionMapping(remainingEnabledDefinitions)

  return { schemas: newSchemas, collectionMapping }
}

module.exports = {
  exists,
  find,
  getBucketDefinitions,
  getDefinition,
  appendCollectionMapping,
  validateDefinition,
  validateEnableDefinition,
  validateDisableDefinition
}