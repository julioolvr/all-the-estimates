import IParticipant from '../../../common/interfaces/IParticipant'

class Participant implements IParticipant {
  constructor(
    public name: string
  ) {}

  static fromResult(result): Participant {
    return new Participant(result.name)
  }
}

export default Participant
