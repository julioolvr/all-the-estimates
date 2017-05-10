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

type Mutation {
  vote(roomKey: String!, voterName: String!, value: Int!): Vote
  join(roomKey: String!, voterName: String!): Participant
  leave(roomKey: String!, voterName: String!): Room
  reset(roomKey: String!): Room
}

type Subscription {
  onRoomEvent(roomKey: String!): RoomEvent
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
    async vote(_, { roomKey, voterName, value }) {
      const room = await Room.findByKey(roomKey)
      return room.vote(voterName, value)
    },
    async reset(_, { roomKey }) {
      const room = await Room.findByKey(roomKey)
      await room.resetVotes()
      return room
    },
    async join(_, { roomKey, voterName }) {
      const room = await Room.findOrCreateByKey(roomKey)
      return await room.addParticipant(voterName)
    },
    async leave(_, { roomKey, voterName }) {
      const room = await Room.findByKey(roomKey)
      await room.removeParticipantWithName(voterName)
      return room
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
