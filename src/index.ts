import express = require('express')
import bodyParser = require('body-parser')
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express'

import schema from './schema'

const PORT = 3000
const app = express()

const GRAPHQL_PATH = '/graphql'
app.use(GRAPHQL_PATH, bodyParser.json(), graphqlExpress({ schema }))
app.use('/graphiql', graphiqlExpress({ endpointURL: GRAPHQL_PATH }))

app.listen(PORT, () => {
  console.log(`🌎 App listening on port ${PORT}`)
})
