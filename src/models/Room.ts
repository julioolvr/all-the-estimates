import db from '../db'
import Participant from './Participant'
import pubsub from '../pubsub'

const collection = db.collection('rooms')

class Room {
  constructor(
    public id: string,
    public key: string,
    public participants: Array<Participant>,
    public votes: Array<any>
  ) {}

  async addParticipant(name: string): Promise<Participant> {
    const participant = new Participant(name)
    this.participants.push(participant)

    return new Promise<Participant>((resolve, reject) => {
      collection.update(
        { _id: this.id },
        { $push: { participants: participant } },
        (err, result) => err ? reject(err) : resolve(participant)
      )
    }).then(participant => {
      pubsub.publish('onParticipantJoined', {
        roomKey: this.key,
        onParticipantJoined: participant
      })

      return participant
    })
  }

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
