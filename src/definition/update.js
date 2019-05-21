const { Definition } = require('mushimas-models')
const { find, getBucketDefinitions, getDefinition, appendCollectionMapping, validateDefinition } = require('./utils')
const validOptions = require('./validOptions')
const flatten = require('./flatten')
const { ResourceError, ValidationError } = require('../errors')

const validateOptionUpdate = (optionKey, optionValue, currentOptions) => {
  const optionRules = validOptions[currentOptions.type][optionKey]
  
  if (!optionRules) {
    throw new ValidationError('unrecognizedOption', `the following option: ${optionKey} is not valid for a field of type: ${currentOptions.type}`)
  }
  
  if (optionRules.mutable === false && optionValue !== currentOptions[optionKey]) {
    throw new ValidationError('immutableOption', `the following option: ${optionKey} is immutable for a field of type: ${currentOptions.type}`)
  }
}

const validateUpdate = async (bucketId, _id, updates) => {
  const definitions = await getBucketDefinitions(bucketId)

  const definition = getDefinition(definitions, _id)

  if (!definition) {
    throw new ResourceError('notFound', `A definition with id: ${_id} could not be found in bucket with id: ${bucketId}`)
  }

  if (definition.state !== 'ENABLED') {
    throw new ValidationError('disabledDefinition', `Definition with id: ${_id} is not enabled. Definitions must be enabled in order to be updated`) 
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
  const { schemas, collectionMapping } = validateDefinition(definitions, updatedDefinition)

  return { updatedFields, schemas, collectionMapping }
}

const commitUpdate = async (bucketId, _id, fields) => {
  const flatDef = flatten({
    '@definition': { fields }
  })

  const matchCondition = {
    _id,
    '@bucketId': bucketId,
    '@state': 'ENABLED'
  }

  let updatedDefinition = await Definition.findOneAndUpdate(matchCondition, {
    $set: {
      ...flatDef,
      '@lastModified': new Date()
    }
  })

  if (!updatedDefinition) {
    throw new ResourceError('notFound', `A definition with id: ${_id} could not be found in bucket with id: ${bucketId}`)
  }

  const details = {
    _id: updatedDefinition._id,
    name: updatedDefinition['@definition'].name,
    class: updatedDefinition['@definition'].class
  }

  return details
}

module.exports = async ({ environment, args }) => {
  const { bucket } = environment
  const { _id, fields } = args
  
  const { updatedFields, schemas, collectionMapping } = await validateUpdate(bucket.id, _id, fields)

  const definition = await commitUpdate(bucket.id, _id, updatedFields)

  return { definition, collectionMapping: appendCollectionMapping(collectionMapping, definition), schemas }
}