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
  _id: '5cd4feb103a301fce2739ec4',
  fields: [
    {
      name: 'name',
      options: {
        type: 'string',
        required: true,
        enabled: false
      }
    }
  ]
}

update({ environment, args, ackTime: new Date() }).then(res => {
  console.log(res)
}, err => {
  console.log(err)
})