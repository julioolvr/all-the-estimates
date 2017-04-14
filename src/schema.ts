import { makeExecutableSchema } from 'graphql-tools'

const schemaDef = `
type Room {
  id: ID,
  participants: [Participant],
  votes: [Vote]
}

type Participant {
  id: ID,
  name: String
}

type Vote {
  participant: Participant,
  value: Int
}

type Query {
  room(id: ID!): Room
}

schema {
  query: Query
}
`

const resolvers = {
  Query: {
    room(_, { id }) {
      return {
        id: id,
        participants: [{ id: 1 }, { id: 2 }],
        votes: [{ participant: { id: 2 }, value: 5 }]
      }
    }
  },
  Participant: {
    id({ id }) {
      return id
    },
    name({ id }) {
      return `someone ${id}`
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs: schemaDef,
  resolvers: resolvers
})

export default schema
