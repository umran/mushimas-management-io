const { Configuration } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({ environment, ackTime, session }) => {
  const { bucket } = environment

  let options

  if (session) {
    options = { session }
  }

  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucket.id
  }

  let enabledConfiguration = await Configuration.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'ENABLED',
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, options)

  if (!enabledConfiguration) {
    throw new ResourceError('notFound', `could not find a configuration record for bucket with id: ${bucket.id}`)
  }

  return enabledConfiguration._id.toString()
}