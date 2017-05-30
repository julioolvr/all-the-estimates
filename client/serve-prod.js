const express = require('express')

const server = express()

server.use('/static', express.static(__dirname + '/build/static'))
server.get('/*', (req, res) => {
  res.sendFile(__dirname + '/build/index.html')
})

server.listen(8080, () => console.log(`Server listening on :8080`))