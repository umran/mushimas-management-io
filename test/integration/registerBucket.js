const createBucket = require('../../src/bucket/create')
const createConfiguration = require('../../src/configuration/create')
const mongodb = require('./mongodb')

// start database connection
mongodb.init()

const firstEnvironment = {
  organization: {
    id: '2466',
    name: 'irukandjilabs'
  }
}

const bucket = {
  name: 'heat'
}

createBucket({ environment: firstEnvironment, args: bucket, ackTime: new Date() }).then(async bucketId => {
  console.log('bucket created with id: ', bucketId)

  console.log('registering bucket configuration record...')

  const secondEnvironment = {
    bucket: {
      id: bucketId
    }
  }

  const configurationId = await createConfiguration({ environment: secondEnvironment, ackTime: new Date() })

  console.log('bucket configuration created with id: ', configurationId)

}, err => {
  console.error(err)
})