const { generateElasticMappings } = require('mushimas').elasticsearch
const staticMappings = require('./staticMappings')

const createIndex = async (index, client) => {
  try {
    await client.indices.create({ index })
  } catch (err) {
    if (err.response) {
      const response = JSON.parse(err.response)
      if (response.error && response.error.type === 'resource_already_exists_exception') {
        return
      }
    }

    throw err
  }
}

const createMapping = async (index, mapping, client) => {
  await client.indices.putMapping({
    index,
    type: index,
    body: mapping
  })
}

// the upsert method should be used on creation of or updating a definition
module.exports = client => async ({ environment, args }) => {
  const { bucket } = environment
  const { definition, schemas } = args

  const mappings = generateElasticMappings(schemas)

  const relevantMapping = {
    properties: {
      ...mappings[definition.name]().properties,
      ...staticMappings
    }
  }

  await createIndex(`${bucket.id}_${definition._id}`, client)
  await createMapping(`${bucket.id}_${definition._id}`, relevantMapping, client)

  return args
}