const { Bucket } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({ environment, args }) => {
  const { organization } = environment
  const { _id } = args

  const matchCondition = {
    _id,
    '@state': { $ne: 'DELETED' },
    '@organizationId': organization.id
  }

  let deletedBucket = await Bucket.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'DELETED',
      '@lastModified': new Date()
    }
  }, { new: true, lean: true })

  if (!deletedBucket) {
    throw new ResourceError('notFound', `could not find a bucket with id: ${_id} for organization with id: ${organization.id}`)
  }

  return deletedBucket._id.toString()
}