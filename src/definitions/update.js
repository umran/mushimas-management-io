const { Definition } = require('mushimas-models')
const { validateSchemas } = require('mushimas').validator
const { find, lookupDefinition, getExistingConfig, constructConfig } = require('./utils')
const immutableOptions = require('./immutableOptions')
const flatten = require('./flatten')

const validateUpdate = async (bucketId, args) => {
  const { _id, fields: updates } = args

  const definition = await lookupDefinition(bucketId, _id)

  if (!definition) {
    throw new Error('the specified definition could not be found')
  }
  
  // first, update all existing fields
  const existingFields = definition['@definition'].fields
  let updatedFields = [ ...existingFields ]

  // for each update field, if the field already exists, update it
  updates.forEach(update => {
    let [existingField, fieldIndex] = find(existingFields, field => field.name === update.name)

    if (existingField) {
      // merge existing options with each new option if it is legal
      const mergedOptions = Object.keys(update.options).reduce((agg, optionKey) => {
        // handle the case where optionKey === 'item'
        if (optionKey === 'item') {

          // if existingField is not an array throw an exception
          if (existingField.options.type !== 'array') {
            throw new Error('the item option is only valid inside array fields')
          }

          agg['item'] = Object.keys(update.options.item).reduce((innerAgg, innerOptionKey) => {
            if (immutableOptions.includes(innerOptionKey) && existingField.options.item[innerOptionKey] !== update.options.item[innerOptionKey]) {
              throw new Error('cannot mutate immutable field options')
            }

            innerAgg[innerOptionKey] = update.options.item[innerOptionKey]

            return innerAgg
          }, { ...existingField.options.item })

        } else {
          if (immutableOptions.includes(optionKey) && existingField.options[optionKey] !== update.options[optionKey]) {
            throw new Error('cannot mutate immutable field options')
          }

          agg[optionKey] = update.options[optionKey]
        }

        return agg
      }, { ...existingField.options })

      updatedFields[fieldIndex] = {
        name: update.name,
        options: mergedOptions
      }
    } else {
      updatedFields.push(update)
    }
  })

  const updatedDefinition = {
    ...definition['@definition'],
    fields: updatedFields
  }

  let existingConfig = await getExistingConfig(bucketId)
  let updatedConfig = constructConfig(existingConfig, updatedDefinition)

  // finally validate the updated config
  validateSchemas(updatedConfig)

}

const commitUpdate = async (bucketId, args, ackTime, session) => {
  let { _id, fields } = args
  
  let options

  if (session) {
    options = { session }
  }

  const flatDef = flatten({
    '@definition': { fields }
  })

  const matchCondition = {
    _id,
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucketId
  }

  const definition = await Definition.findOneAndUpdate(matchCondition, {
    $set: {
      ...flatDef,
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, options)

  if (!definition) {
    throw new Error('the specified definition could not be found')
  }

  return _id
}

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket } = environment
  
  await validateUpdate(bucket.id, args)

  return await commitUpdate(bucket.id, args, ackTime, session)
}