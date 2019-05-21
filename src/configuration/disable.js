const { Configuration } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({ environment }) => {
  const { bucket } = environment

  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucket.id
  }

  let disabledConfiguration = await Configuration.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'DISABLED',
      '@lastModified': new Date()
    }
  })

  if (!disabledConfiguration) {
    throw new ResourceError('notFound', `could not find a configuration record for bucket with id: ${bucket.id}`)
  }

  return disabledConfiguration._id.toString()
}