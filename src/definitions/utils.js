const { Definition } = require('mushimas-models')

const exists = (arr, lambda) => {
  for (let i = 0; i < arr.length; i++) {
    if (lambda(arr[i]) === true) {
      return true
    }
  }

  return false
}

const parseDefinition = definition => {
  const _class = definition.class
  const fields = definition.fields

  const parsedFields = fields.reduce((parsed, field) => {
    if (field.options.type === 'array') {
      if (field.options.item.enabled === true) {
        parsed[field.name] = field.options
      }
    } else if (field.options.enabled === true) {
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

const lookupDefinition = async (bucketId, _id) => {
  return await Definition.findOne({ _id, '@state': { $ne: 'DELETED' }, '@bucketId': bucketId }).lean()
}

const ensureUnique = (existingConfig, definition) => {
  Object.keys(existingConfig).forEach(key => {
    if (key === definition.name) {
      throw new Error('duplicate definition names are not allowed')
    }
  })
}

const getExistingConfig = async (bucketId) => {
  let definitions = await Definition.find({ '@state': { $ne: 'DELETED' }, '@bucketId': bucketId }, { _id: 1, '@definition': 1 }).lean()

  return definitions.reduce((config, definition) => {
    config[definition['@definition'].name] = parseDefinition(definition['@definition'])

    return config
  }, {})
}

const constructConfig = (existingConfig, definition) => {
  return {
    ...existingConfig,
    [definition.name]: parseDefinition(definition)
  }
}

module.exports = {
  exists,
  parseDefinition,
  lookupDefinition,
  getExistingConfig,
  constructConfig
}