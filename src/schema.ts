import { makeExecutableSchema } from 'graphql-tools'

const schemaDef = `
type Person {
  id: ID,
  name: String
}

type Query {
  person: Person
}

schema {
  query: Query
}
`

const resolvers = {
  Query: {
    person() {
      return { id: 1, name: 'Arthur Dent' }
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs: schemaDef,
  resolvers: resolvers
})

export default schema
