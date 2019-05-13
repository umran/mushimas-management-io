const _delete = require('../../src/configuration/delete')
const mongodb = require('./mongodb')

// connect to the database
mongodb.init()

const environment = {
  bucket: {
    id: '5cd98a79814e825fab6e7b6c',
    name: 'heat'
  }
}

_delete({ environment, ackTime: new Date() }).then(res => {
  console.log(res)
}, err => {
  console.error(err)
})