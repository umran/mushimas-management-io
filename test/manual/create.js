const create = require('../../src/definitions/create')
const mongodb = require('./mongodb')

// connect to the database
mongodb.init()

const environment = {
  bucket: {
    id: '5cd1b6d338e2a673c454ee0a',
    name: 'Fexbro'
  }
}

const definition = {
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

create({ environment, args: definition, ackTime: new Date() }).then(res => {
  console.log(res)
}, err => {
  console.log(err)
})