const { Configuration } = require('mushimas-models')

// this method should only be used on creation of a new bucket
module.exports = async ({ environment }) => {
  const { bucket } = environment

  // first check if a configuration by the same bucketId exists
  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucket.id
  }

  const existingConfiguration = await Configuration.findOne(matchCondition).lean()

  if (existingConfiguration) {
    return existingConfiguration
  }

  const [ newConfiguration ] = await Configuration.create([{
    '@state': 'ENABLED',
    '@lastModified': new Date(),
    '@bucketId': bucket.id
  }], { lean: true })

  return newConfiguration
}