import express = require('express')
import bodyParser = require('body-parser')
import { createServer } from 'http'
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express'
import { SubscriptionManager } from 'graphql-subscriptions'
import { SubscriptionServer } from 'subscriptions-transport-ws'

import pubsub from './pubsub'
import schema from './schema'
import Room from './models/Room'

const PORT = 8000

const app = express()
const server = createServer(app)

const subscriptionManager = new SubscriptionManager({
  schema,
  pubsub,
  setupFunctions: {
    onRoomEvent: (options, args) => ({
      onRoomEvent: {
        filter: payload => args.roomKey === payload.roomKey
      }
    })
  }
})

const GRAPHQL_PATH = '/graphql'
app.use(GRAPHQL_PATH, bodyParser.json(), graphqlExpress({ schema }))
app.use('/graphiql', graphiqlExpress({
  endpointURL: GRAPHQL_PATH,
  subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
}))

server.listen(PORT, () => {
  new SubscriptionServer(
    {
      subscriptionManager: subscriptionManager,
      onSubscribe: async (message, params, connection) => {
        if (message.type !== 'subscription_start') {
          return params
        }

        // TODO: Validation
        // TODO: Try not to depend on variables (parse the query?)
        const { roomKey, participantName } = message.variables
        const room = await Room.findOrCreateByKey(roomKey)

        // TODO: Check what's best when participant already present
        // TODO: Remove participant on unsubscribe somehow
        // (maybe associate participant to subscription id)
        room.addParticipantIfNew(participantName)

        return params
      }
    },
    {
      server: server,
      path: '/subscriptions'
    }
  )

  console.log(`🌎 App listening on port ${PORT}`)
})
