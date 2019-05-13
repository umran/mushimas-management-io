const _delete = require('../../src/bucket/delete')
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
  _id: '5cd989b2814e825fab6e7826'
}

_delete({ environment, args: bucket, ackTime: new Date() }).then(res => {
  console.log(res)
}, err => {
  console.error(err)
})