const { Configuration } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket } = environment
  const { collectionMapping, configuration } = args

  let options

  if (session) {
    options = { session }
  }

  const matchCondition = {
    '@state': 'ENABLED',
    '@bucketId': bucket.id
  }

  let updatedConfiguration = await Configuration.findOneAndUpdate(matchCondition, {
    $set: {
      '@configuration': {
        collectionMapping: JSON.stringify(collectionMapping),
        configuration: JSON.stringify(configuration)
      },
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, options)

  if (!updatedConfiguration) {
    throw new ResourceError('notFound', `could not find an enabled configuration record for bucket with id: ${bucket.id}`)
  }

  return updatedConfiguration._id.toString()
}