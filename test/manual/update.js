const update = require('../../src/definitions/update')
const mongodb = require('./mongodb')

// connect to the database
mongodb.init()

const environment = {
  bucket: {
    id: '5cd1b6d338e2a673c454ee0a',
    name: 'Fexbro'
  }
}

const args = {
  _id: '5cd2bc8585d7b43f38311175',
  fields: [
    {
      name: 'name',
      options: {
        type: 'string',
        required: false,
        enabled: false,
        es_indexed: true,
        es_keyword: true
      }
    }
  ]
}

update({ environment, args, ackTime: new Date() }).then(res => {
  console.log(res)
}, err => {
  console.log(err)
})