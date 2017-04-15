import tingodb = require('tingodb')

const Db = tingodb({
  memStore: true
}).Db

export default new Db('/in/memory/db', {})
