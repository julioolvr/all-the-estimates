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

enum ParticipantEventType {
  JOINED
  LEFT
}

type ParticipantEvent {
  type: ParticipantEventType,
  participant: Participant
}

type VoteEvent {
  vote: Vote
}

union RoomEvent = ParticipantEvent | VoteEvent

type Query {
  room(key: String!): Room
}

type Subscription {
  onRoomEvent(roomKey: String!, voterName: String!): RoomEvent
}

schema {
  query: Query,
  subscription: Subscription
}
`

const resolvers = {
  Query: {
    room(_, { key }) {
      return Room.findOrCreateByKey(key)
    }
  },
  RoomEvent: {
    __resolveType(obj, context, info) {
      if (obj.participant) {
        return 'ParticipantEvent'
      }

      if (obj.vote) {
        return 'VoteEvent'
      }

      return null
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs: schemaDef,
  resolvers: resolvers
})

export default schema
