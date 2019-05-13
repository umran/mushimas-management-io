const { Configuration } = require('mushimas-models')

// this method should only be used on creation of a new bucket
module.exports = async ({ environment, ackTime, session }) => {
  const { bucket } = environment

  let options = {
    upsert: true,
    new: true
  }

  if (session) {
    options = {
      ...options,
      session
    }
  }

  const matchCondition = {
    '@bucketId': bucket.id
  }

  let newConfiguration = await Configuration.findOneAndUpdate(matchCondition, {
    '@state': 'ENABLED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@bucketId': bucket.id,
    '@version': 0
  }, options)

  return newConfiguration._id.toString()
}