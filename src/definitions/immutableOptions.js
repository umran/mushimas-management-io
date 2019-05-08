const systemImmutable = [
  'type',
  'ref',
]

const searchImmutable = [
  'es_indexed',
  'es_keyword',
  'es_boost',
  'es_analyzer',
  'es_search_analyzer',
  'es_search_quite_analyzer'
]

module.exports = [
  ...systemImmutable,
  ...searchImmutable
]