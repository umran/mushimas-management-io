const { Configuration } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({ environment, args }) => {
  const { bucket } = environment
  const { collectionMapping, schemas } = args

  const matchCondition = {
    '@state': 'ENABLED',
    '@bucketId': bucket.id
  }

  let updatedConfiguration = await Configuration.findOneAndUpdate(matchCondition, {
    $set: {
      '@configuration': {
        collectionMapping: JSON.stringify(collectionMapping),
        schemas: JSON.stringify(schemas)
      },
      '@lastModified': new Date()
    }
  }, { new: true })

  if (!updatedConfiguration) {
    throw new ResourceError('notFound', `could not find an enabled configuration record for bucket with id: ${bucket.id}`)
  }

  return updatedConfiguration
}