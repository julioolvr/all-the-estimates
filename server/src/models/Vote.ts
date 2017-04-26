import Participant from './Participant'
import IVote from '../../../common/interfaces/IVote'

class Vote implements IVote {
  constructor(
    public participant: Participant,
    public value: number
  ) {}

  static fromResult(result, participants: Array<Participant>): Vote {
    const participant = participants.find(participant => participant.name === result.voterName)
    return new Vote(participant, result.value)
  }

  toRecord() {
    return {
      voterName: this.participant.name,
      value: this.value
    }
  }
}

export default Vote
