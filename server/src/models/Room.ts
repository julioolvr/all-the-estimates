import db from '../db'
import pubsub from '../pubsub'
import Participant from './Participant'
import Vote from './Vote'
import IRoom from '../../../common/interfaces/IRoom'

const collection = db.collection('rooms')

class Room implements IRoom {
  constructor(
    public id: string,
    public key: string,
    public participants: Array<Participant>,
    public votes: Array<Vote>
  ) {}

  async addParticipant(name: string): Promise<Participant> {
    console.log('Room#addParticipant', name)
    const participant = new Participant(name)
    this.participants.push(participant)

    return new Promise<Participant>((resolve, reject) => {
      console.log('Adding participant...')
      collection.update(
        { _id: this.id },
        { $push: { participants: participant } },
        (err, result) => err ? reject(err) : resolve(participant)
      )
    }).then(participant => {
      console.log('Added participant', participant)
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
    const existingVote = this.findVoteForName(voterName)

    if (existingVote) {
      existingVote.value = value
      await this.updateVote(voterName, value)
      return existingVote
    } else {
      return this.registerNewVote(voterName, value)
    }
  }

  async registerNewVote(voterName: string, value: number) {
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
        { $push: { votes: vote.toRecord() } },
        (err, result) => err ? reject(err) : resolve(vote)
      )
    })
  }

  async updateVote(voterName: string, newValue: number): Promise<Vote> {
    return new Promise<Vote>((resolve, reject) => {
      const votes = this.votes
      const vote = votes.find(vote => vote.participant.name === voterName)
      vote.value = newValue

      collection.findOne(
        { _id: this.id, 'votes.voterName': voterName },
        (err, res) => console.log('updateVote find', err, res, voterName)
      )

      collection.update(
        { _id: this.id },
        { $set: { votes: votes.map(vote => vote.toRecord()) } },
        (err, result) => (console.log('updateVote', err, result), err ? reject(err) : resolve(vote))
      )
    })
  }

  findVoteForName(voterName: string): Vote | undefined {
    return this.votes.find(vote => vote.participant.name === voterName)
  }

  async resetVotes(): Promise<void> {
    this.votes = []

    return new Promise<void>((resolve, reject) => {
      collection.update(
        { _id: this.id },
        { $set: { votes: [] } },
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
