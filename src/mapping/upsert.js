const mappings = require('./mappings')

const INDEX = 'mushimas_document'

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

module.exports = async client => {
  await createIndex(INDEX, client)
  await createMapping(INDEX, mappings, client)
}