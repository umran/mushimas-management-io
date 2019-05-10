const array = {
  type: {
    required: true,
    mutable: false
  },
  item: {
    required: true,
    mutable: false
  },
  required: {
    required: true,
    mutable: true
  }
}

const reference = {
  type: {
    required: true,
    mutable: false
  },
  ref: {
    required: true,
    mutable: false
  },
  required: {
    required: true,
    mutable: true
  },
  enabled: {
    required: true,
    mutable: true
  },
  es_indexed: {
    required: true,
    mutable: false
  }
}

const string = {
  type: {
    required: true,
    mutable: false
  },
  required: {
    required: true,
    mutable: true
  },
  enabled: {
    required: true,
    mutable: true
  },
  es_indexed: {
    required: true,
    mutable: false
  },
  es_keyword: {
    required: true,
    mutable: false
  }
}

const integer = {
  type: {
    required: true,
    mutable: false
  },
  required: {
    required: true,
    mutable: true
  },
  enabled: {
    required: true,
    mutable: true
  },
  es_indexed: {
    required: true,
    mutable: false
  }
}

const float = {
  type: {
    required: true,
    mutable: false
  },
  required: {
    required: true,
    mutable: true
  },
  enabled: {
    required: true,
    mutable: true
  },
  es_indexed: {
    required: true,
    mutable: false
  }
}

const date = {
  type: {
    required: true,
    mutable: false
  },
  required: {
    required: true,
    mutable: true
  },
  enabled: {
    required: true,
    mutable: true
  },
  es_indexed: {
    required: true,
    mutable: false
  }
}

const boolean = {
  type: {
    required: true,
    mutable: false
  },
  required: {
    required: true,
    mutable: true
  },
  enabled: {
    required: true,
    mutable: true
  },
  es_indexed: {
    required: true,
    mutable: false
  }
}

module.exports = {
  array,
  reference,
  string,
  integer,
  float,
  date,
  boolean
}