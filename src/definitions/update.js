const { Definition } = require('mushimas-models')
const { find, getBucketDefinitions, getDefinition, validateDefinition } = require('./utils')
const validOptions = require('./validOptions')
const flatten = require('./flatten')

const validateOptionUpdate = (optionKey, optionValue, currentOptions) => {
  const optionRules = validOptions[currentOptions.type][optionKey]
  
  if (!optionRules) {
    throw new Error(`the following option: ${optionKey} is not valid for a field of type: ${currentOptions.type}`)
  }
  
  if (optionRules.mutable === false && optionValue !== currentOptions[optionKey]) {
    throw new Error(`the following option: ${optionKey} is immutable for a field of type: ${currentOptions.type}`)
  }
}

const validateAndPrepareUpdate = async (bucketId, _id, updates) => {
  const definitions = await getBucketDefinitions(bucketId)

  const definition = getDefinition(definitions, _id)

  if (!definition) {
    throw new Error(`A definition with id: ${_id} could not be found in bucket with id: ${bucketId}`)
  }

  if (definition.state !== 'ENABLED') {
    throw new Error(`Definition with id: ${_id} is not enabled. Definitions must be enabled in order to be updated`) 
  }
  
  // first, update all existing fields
  const existingFields = definition.fields
  
  // this variable must be mutable
  let updatedFields = [ ...existingFields ]

  // for each update field, if the field already exists, update it
  updates.forEach(update => {
    const [existingField, fieldIndex] = find(existingFields, field => field.name === update.name)

    if (existingField) {
      // merge existing options with each new option if it is legal
      const mergedOptions = Object.keys(update.options).reduce((agg, optionKey) => {

        // handle the case where optionKey === 'item'
        if (optionKey === 'item') {
          agg[optionKey] = Object.keys(update.options.item).reduce((innerAgg, innerOptionKey) => {
            validateOptionUpdate(innerOptionKey, update.options.item[innerOptionKey], existingField.options.item)

            innerAgg[innerOptionKey] = update.options.item[innerOptionKey]

            return innerAgg
          }, { ...existingField.options.item })

        } else {
          // ensure the optionKey is a valid option for the declared field type
          validateOptionUpdate(optionKey, update.options[optionKey], existingField.options)

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
    ...definition,
    fields: updatedFields
  }

  // finally validate the updated definition
  validateDefinition(definitions, updatedDefinition)

  return updatedFields
}

const commitUpdate = async (bucketId, _id, fields, ackTime, session) => {
  // this variable must be mutable
  let options

  if (session) {
    options = { session }
  }

  const flatDef = flatten({
    '@definition': { fields }
  })

  const matchCondition = {
    _id,
    '@state': 'ENABLED',
    '@bucketId': bucketId
  }

  const updatedDefinition = await Definition.findOneAndUpdate(matchCondition, {
    $set: {
      ...flatDef,
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, options)

  return updatedDefinition._id.toString()
}

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket } = environment
  const { _id, fields } = args
  
  const updatedFields = await validateAndPrepareUpdate(bucket.id, _id, fields)

  return await commitUpdate(bucket.id, _id, updatedFields, ackTime, session)
}