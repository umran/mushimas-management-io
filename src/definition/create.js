const { Definition } = require('mushimas-models')
const { getBucketDefinitions, appendCollectionMapping, validateDefinition, getDefinitionByName } = require('./utils')

const validateCreate = async (bucketId, definition) => {
  const definitions = await getBucketDefinitions(bucketId)

  // check if definition already exists
  const existingDefinition = getDefinitionByName(definitions, definition.name)

  if (existingDefinition) {
    const validationResults = validateDefinition(definitions, existingDefinition)
    
    const details = {
      _id: existingDefinition._id,
      name: existingDefinition.name,
      class: existingDefinition.class
    }

    return { ...validationResults, existingDefinition: details }
  }

  // validate the definition
  return validateDefinition(definitions, definition)
}

const commitCreate = async (bucketId, definition) => {  
  const newDefinition = await Definition.create({
    '@definition': definition,
    '@state': 'ENABLED',
    '@lastModified': new Date(),
    '@bucketId': bucketId
  })

  return {
    _id: newDefinition._id,
    name: newDefinition['@definition'].name,
    class: newDefinition['@definition'].class
  }
}

module.exports = async ({ environment, args }) => {
  const { bucket } = environment

  const { schemas, collectionMapping, existingDefinition } = await validateCreate(bucket.id, args)

  let resultantDefinition

  if (existingDefinition) {
    resultantDefinition = existingDefinition
  } else {
    resultantDefinition = await commitCreate(bucket.id, args)
  }

  return { definition: resultantDefinition, collectionMapping: appendCollectionMapping(collectionMapping, resultantDefinition), schemas }
}