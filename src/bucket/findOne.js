const { Bucket } = require('mushimas-models')

module.exports = async ({ environment, args }) => {
  const { organization } = environment
  const { _id } = args

  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@organizationId': organization.id,
    _id
  }

  const bucket = await Bucket.findOne(matchCondition).lean()

  const extracted = {
    ...bucket['@bucket'],
    _id: bucket._id.toString(),
    _state: bucket['@state'],
    _lastModified: bucket['@lastModified']
  }
  
  return extracted
}