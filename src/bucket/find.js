const { Bucket } = require('mushimas-models')

module.exports = async ({ environment }) => {
  const { organization } = environment

  // get all buckets listed under the same organizationId
  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@organizationId': organization.id
  }

  const existingBuckets = await Bucket.find(matchCondition).lean()

  return existingBuckets.map(bucket => {
    let extracted = {
      ...bucket['@bucket'],
      _id: bucket._id.toString(),
      _state: bucket['@state'],
      _lastModified: bucket['@lastModified']
    }
    
    return extracted
  })
}