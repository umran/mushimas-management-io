const update = require('../../src/configuration/update')
const mongodb = require('./mongodb')

// connect to the database
mongodb.init()

const environment = {
  bucket: {
    id: '5cd98a79814e825fab6e7b6c',
    name: 'heat'
  }
}

let args = {
  configuration: {
    person: {
      class: 'collection',
      fields: {
        name: {
          type: 'string',
          enabled: true,
          required: true,
          es_indexed: true,
          es_keyword: true
        }
      }
    }
  },
  collectionMapping: {
    person: '1230912309129831'
  }
}

update({ environment, args, ackTime: new Date() }).then(res => {
  console.log(res)
}, err => {
  console.error(err)
})