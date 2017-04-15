import db from '../db'

const collection = db.collection('rooms')

class Room {
  constructor(
    public id: string,
    public key: string,
    public participants: Array<any>,
    public votes: Array<any>
  ) {}

  static fromResult(result): Room {
    return new Room(
      result._id,
      result.key,
      result.participants,
      result.votes
    )
  }

  static async findByKey(key: string): Promise<Room> {
    return new Promise<Room>((resolve, reject) => {
      collection.findOne({ key }, (err, item) =>
        err ? reject(err) : resolve(item && Room.fromResult(item))
      )
    })
  }

  static async createWithKey(key: string): Promise<Room> {
    return new Promise<Room>((resolve, reject) => {
      collection.insert({ key, participants: [], votes: [] }, (err, result) => {
        if (err) {
          return reject(err)
        }

        resolve(Room.fromResult(result[0]))
      })
    })
  }

  static async findOrCreateByKey(key: string): Promise<Room> {
    const room = await Room.findByKey(key)

    if (room) {
      return room
    }

    return await Room.createWithKey(key)
  }
}

export default Room
