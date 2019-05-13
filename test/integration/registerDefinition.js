const createDefinition = require('../../src/definition/create')
const updateDefinition = require('../../src/definition/update')
const disableDefinition = require('../../src/definition/disable')
const enableDefinition = require('../../src/definition/enable')
const deleteDefinition = require('../../src/definition/delete')
const upsertMapping = require('../../src/mapping/upsert')
const mongodb = require('./mongodb')
const elasticsearch = require('./elasticsearch')

const elasticClient = elasticsearch.init()

mongodb.init()

const firstEnvironment = {
  bucket: {
    id: '5cd99fb0814e825fab6ec275'
  }
}

const def = {
  name: 'person',
  class: 'collection',
  fields: [
    {
      name: 'name',
      options: {
        type: 'string',
        required: true,
        enabled: true,
        es_indexed: true,
        es_keyword: true
      }
    }
  ]
}

const update = {
  _id: '5cd9c397814e825fab6f2932',
  fields: [
    {
      name: 'name',
      options: {
        required: false
      }
    },
    {
      name: 'gender',
      options: {
        type: 'boolean',
        required: true,
        enabled: true,
        es_indexed: true
      }
    }
  ]
}

console.log('CREATING DEFINITION...')
createDefinition({ environment: firstEnvironment, args: def, ackTime: new Date() }).then( async ({ definition, collectionMapping, configuration }) => {
  
  console.log(configuration)

  console.log('MAPPING DEFINITION...')
  await upsertMapping({ environment: firstEnvironment, definition, schemas: configuration, client: elasticClient })

  console.log('successfully upserted the initial mapping to elasticsearch')

  console.log('UPDATING DEFINITION...')
  const { definition: def, collectionMapping: cmp, configuration: cfg } = await updateDefinition({ environment: firstEnvironment, args: update, ackTime: new Date() })

  console.log(cfg)

  console.log('REMAPPING DEFINITION...')
  await upsertMapping({ environment: firstEnvironment, definition: def, schemas: cfg, client: elasticClient })

  console.log('successfully upserted the updated mapping to elasticsearch')
}, err => {
  console.error(err)
})