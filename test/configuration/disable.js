const disable = require('../../src/configuration/disable')
const mongodb = require('./mongodb')

// connect to the database
mongodb.init()

const environment = {
  bucket: {
    id: '5cd98a79814e825fab6e7b6c',
    name: 'heat'
  }
}

disable({ environment, ackTime: new Date() }).then(res => {
  console.log(res)
}, err => {
  console.error(err)
})