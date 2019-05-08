const { Definition } = require('mushimas-models')
const { validateSchemas } = require('mushimas').validator
const { find, lookupDefinition, getExistingConfig } = require('./utils')
const immutableOptions = require('./immutableOptions')
const flatten = require('./flatten')

const validateUpdate = async (bucketId, args) => {
  const { _id, fields: updates } = args

  const definition = await lookupDefinition(bucketId, _id)
  
  // this object will be mutated to reflect the updated definition
  let config = await getExistingConfig(bucketId)

  updates.forEach(update => {
    if (exists(definition.fields, field => field.name === update.name)) {

      let relevantField = config[definition.name].fields[update.name]

      Object.keys(update.options).forEach(optionKey => {
        if (immutableOptions.includes(optionKey) && relevantField[optionKey] !== update.options[optionKey]) {
          throw new Error('cannot mutate an immutable field option')
        }

        if (optionKey === 'item') {
          Object.keys(update.options.item).forEach(innerOptionKey => {
            if (immutableOptions.includes(innerOptionKey) && relevantField.item[innerOptionKey] !== update.options.item[innerOptionKey]) {
              throw new Error('cannot mutate an immutable field option')
            }

            relevantField.item[innerOptionKey] = update.options.item[innerOptionKey]            
          })
        } else {
          relevantField[optionKey] = update.options[optionKey]
        }
      })
    } else {
      config[definition.name].fields[update.name] = update.options      
    }
  })

  // finally validate the updated config
  validateSchemas(config)

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

  const matchConditions = {
    _id,
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucketId
  }

  await Definition.findOneAndUpdate(matchCondition, {
    $set: {
      ...flatDef,
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, options)

  return _id
}

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket } = environment
  
  await validateUpdate(bucket.id, args)

  return await commitUpdate(bucket.id, args, ackTime, session)
}