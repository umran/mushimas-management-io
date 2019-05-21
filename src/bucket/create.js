const { Bucket } = require('mushimas-models')

module.exports = async ({ environment, args }) => {
  const { organization } = environment

  let options = {
    upsert: true,
    new: true
  }

  const matchCondition = {
    '@organizationId': organization.id,
    '@bucket.name': args.name,
    '@state': { $ne: 'DELETED' }
  }

  let newBucket = await Bucket.findOneAndUpdate(matchCondition, {
    '@bucket': args,
    '@state': 'ENABLED',
    '@lastModified': new Date(),
    '@organizationId': organization.id
  }, options)

  return newBucket._id.toString()
}