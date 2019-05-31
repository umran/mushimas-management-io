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