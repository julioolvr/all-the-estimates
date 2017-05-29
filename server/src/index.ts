import express = require('express')
import bodyParser = require('body-parser')
import cors = require('cors')
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

app.use(
  GRAPHQL_PATH,
  bodyParser.json(),
  cors({ origin: 'https://all-the-estimates.now.sh' }),
  graphqlExpress(
    request => ({
      schema,
      context: { participantId: request.headers.participantid }
    })
  )
)

const WS_PROTOCOL = process.env.NODE_ENV === 'production' ? 'wss' : 'ws'

app.use('/graphiql', graphiqlExpress({
  endpointURL: GRAPHQL_PATH,
  subscriptionsEndpoint: `${WS_PROTOCOL}://localhost:${PORT}/subscriptions`,
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

  console.log(`🌎  App listening on port ${PORT}`)
})
