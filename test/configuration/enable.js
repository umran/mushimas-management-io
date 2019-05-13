const enable = require('../../src/configuration/enable')
const mongodb = require('./mongodb')

// connect to the database
mongodb.init()

const environment = {
  bucket: {
    id: '5cd98a79814e825fab6e7b6c',
    name: 'heat'
  }
}

enable({ environment, ackTime: new Date() }).then(res => {
  console.log(res)
}, err => {
  console.error(err)
})