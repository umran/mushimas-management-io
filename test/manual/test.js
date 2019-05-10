const hermione = {
  name: 'granger',
  ing: {
    parsley: true,
    ginger: false
  }
}

console.log(hermione)

const gen = (person) => {
  let out = person.ing

  out.oslo = true

  return out
}

let homeboy = gen(hermione)

homeboy.ginger = true

console.log(hermione)