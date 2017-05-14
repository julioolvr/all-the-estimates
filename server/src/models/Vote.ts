import * as uuid from 'uuid/v4'

import Participant from './Participant'
import IVote from '../../../common/interfaces/IVote'

class Vote implements IVote {
  constructor(
    participant: Participant,
    value: number
  )

  constructor(
    participant: Participant,
    value: number,
    id: string,
  )

  constructor(
    public participant: Participant,
    public value: number,
    public id?: string,
  ) {
    if (!this.id) {
      this.id = uuid()
    }
  }

  static fromResult(result, participants: Array<Participant>): Vote {
    const participant = participants.find(participant => participant.id === result.voterId)
    return new Vote(participant, result.value, result.id)
  }

  toRecord() {
    return {
      id: this.id,
      voterId: this.participant.id,
      value: this.value
    }
  }
}

export default Vote
