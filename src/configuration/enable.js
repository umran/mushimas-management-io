const { Configuration } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({ environment }) => {
  const { bucket } = environment

  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucket.id
  }

  let enabledConfiguration = await Configuration.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'ENABLED',
      '@lastModified': new Date()
    }
  }, { new: true })

  if (!enabledConfiguration) {
    throw new ResourceError('notFound', `could not find a configuration record for bucket with id: ${bucket.id}`)
  }

  return enabledConfiguration
}