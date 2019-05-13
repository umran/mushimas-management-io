const { Bucket } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({ environment, args, ackTime, session }) => {
  const { organization } = environment
  const { _id } = args

  let options

  if (session) {
    options = { session }
  }

  const matchCondition = {
    _id,
    '@state': { $ne: 'DELETED' },
    '@organizationId': organization.id
  }

  let enabledBucket = await Bucket.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'ENABLED',
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, options)

  if (!enabledBucket) {
    throw new ResourceError('notFound', `could not find a bucket with id: ${_id} for organization with id: ${organization.id}`)
  }

  return enabledBucket._id.toString()
}