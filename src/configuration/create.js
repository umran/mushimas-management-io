const { Configuration } = require('mushimas-models')

// this method should only be used on creation of a new bucket
module.exports = async ({ environment }) => {
  const { bucket } = environment

  let options = {
    upsert: true,
    new: true
  }

  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucket.id
  }

  let newConfiguration = await Configuration.findOneAndUpdate(matchCondition, {
    '@state': 'ENABLED',
    '@lastModified': new Date(),
    '@bucketId': bucket.id
  }, options)

  return newConfiguration._id.toString()
}