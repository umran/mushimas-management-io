const { Configuration } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({ environment, args, ackTime, session }) => {
  const { bucket } = environment

  let options

  if (session) {
    options = { session }
  }

  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucket.id
  }

  let deletedConfiguration = await Configuration.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'DELETED',
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, options)

  if (!deletedConfiguration) {
    throw new ResourceError('notFound', `could not find a configuration record for bucket with id: ${bucket.id}`)
  }

  return deletedConfiguration._id.toString()
}