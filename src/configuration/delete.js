const { Configuration } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({ environment }) => {
  const { bucket } = environment

  const matchCondition = {
    '@bucketId': bucket.id
  }

  let deletedConfiguration = await Configuration.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'DELETED',
      '@lastModified': new Date()
    }
  }, { new: true, lean: true })

  if (!deletedConfiguration) {
    throw new ResourceError('notFound', `could not find a configuration record for bucket with id: ${bucket.id}`)
  }

  return deletedConfiguration
}