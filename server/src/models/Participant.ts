import * as uuid from 'uuid/v4'

import IParticipant from '../../../common/interfaces/IParticipant'

class Participant implements IParticipant {
  public id: string

  constructor(
    public name: string
  ) {
    this.id = uuid()
  }

  static fromResult(result): Participant {
    return new Participant(result.name)
  }
}

export default Participant
