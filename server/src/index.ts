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
      subscriptionManager: subscriptionManager
    },
    {
      server: server,
      path: '/subscriptions'
    }
  )

  console.log(`🌎 App listening on port ${PORT}`)
})
