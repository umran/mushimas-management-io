const { Bucket } = require('mushimas-models')

module.exports = async ({ environment, args }) => {
  const { organization } = environment

  // first check if a bucket by the same name exists
  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@organizationId': organization.id,
    '@bucket.name': args.name
  }

  const existingBucket = await Bucket.findOne(matchCondition).lean()

  if (existingBucket) {
    return existingBucket._id.toString()
  }

  const newBucket = await Bucket.create({
    '@bucket': args,
    '@state': 'ENABLED',
    '@lastModified': new Date(),
    '@organizationId': organization.id
  })

  return newBucket._id.toString()
}