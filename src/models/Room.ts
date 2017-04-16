import db from '../db'
import pubsub from '../pubsub'
import Participant from './Participant'
import Vote from './Vote'

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
      pubsub.publish('onRoomEvent', {
        roomKey: this.key,
        onRoomEvent: {
          type: 'JOINED',
          participant
        }
      })

      return participant
    })
  }

  async addParticipantIfNew(name: string): Promise<Participant> {
    const participant = this.participants.find(participant => participant.name === name)

    if (participant) {
      return participant
    }

    return this.addParticipant(name)
  }

  async vote(voterName: string, value: number): Promise<Vote> {
    const participant = this.participants.find(participant => participant.name === voterName)
    const vote = new Vote(participant, value)
    this.votes.push(vote)

    return new Promise<Vote>((resolve, reject) => {
      pubsub.publish('onRoomEvent', {
        roomKey: this.key,
        onRoomEvent: {
          vote
        }
      })

      collection.update(
        { _id: this.id },
        { $push: { votes: { voterName, value } } },
        (err, result) => err ? reject(err) : resolve(vote)
      )
    })
  }

  async resetVotes(): Promise<void> {
    this.votes = []

    return new Promise<void>((resolve, reject) => {
      collection.update(
        { _id: this.id },
        { votes: [] },
        err => err ? reject(err) : resolve()
      )
    })
  }

  static fromResult(result): Room {
    const participants = result.participants.map(Participant.fromResult)
    const votes = result.votes.map(result => Vote.fromResult(result, participants))

    return new Room(
      result._id,
      result.key,
      participants,
      votes
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
