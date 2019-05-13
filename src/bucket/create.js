const { Bucket } = require('mushimas-models')

module.exports = async ({ environment, args, ackTime, session }) => {
  const { organization } = environment

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
    '@organizationId': organization.id,
    '@bucket.name': args.name,
    '@state': { $ne: 'DELETED' }
  }

  let newBucket = await Bucket.findOneAndUpdate(matchCondition, {
    '@bucket': args,
    '@state': 'ENABLED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@organizationId': organization.id,
    '@version': 0
  }, options)

  return newBucket._id.toString()
}