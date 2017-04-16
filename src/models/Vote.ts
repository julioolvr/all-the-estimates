import Participant from './Participant'

class Vote {
  constructor(
    public participant: Participant,
    public value: number
  ) {}

  static fromResult(result, participants: Array<Participant>): Vote {
    const participant = participants.find(participant => participant.name === result.voterName)
    return new Vote(participant, result.value)
  }
}

export default Vote
