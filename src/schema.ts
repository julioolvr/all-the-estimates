import { makeExecutableSchema } from 'graphql-tools'
import Room from './models/Room'

const schemaDef = `
type Room {
  id: ID,
  key: String,
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
  room(key: String!): Room
}

schema {
  query: Query
}
`

const resolvers = {
  Query: {
    room(_, { key }) {
      return Room.findOrCreateByKey(key)
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
