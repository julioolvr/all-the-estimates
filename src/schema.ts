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

type Mutation {
  joinRoom(roomKey: String!, voterName: String!): Room
}

type Subscription {
  onParticipantJoined(roomKey: String!): Participant
}

schema {
  query: Query,
  mutation: Mutation,
  subscription: Subscription
}
`

const resolvers = {
  Query: {
    room(_, { key }) {
      return Room.findOrCreateByKey(key)
    }
  },
  Mutation: {
    async joinRoom(_, { roomKey, voterName }) {
      const room = await Room.findOrCreateByKey(roomKey)
      await room.addParticipant(voterName)
      return room
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs: schemaDef,
  resolvers: resolvers
})

export default schema
