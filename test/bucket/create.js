const create = require('../../src/bucket/create')
const mongodb = require('./mongodb')

// connect to the database
mongodb.init()

const environment = {
  organization: {
    id: '2289',
    name: 'fexbro'
  }
}

const bucket = {
  name: 'heat'
}

create({ environment, args: bucket, ackTime: new Date() }).then(res => {
  console.log(res)
}, err => {
  console.error(err)
})
