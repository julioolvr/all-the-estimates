import * as uuid from 'uuid/v4'

import IParticipant from '../../../common/interfaces/IParticipant'

class Participant implements IParticipant {
  constructor(
    name: string,
  )

  constructor(
    name: string,
    id: string,
  )

  constructor(
    public name: string,
    public id?: string
  ) {
    if (!this.id) {
      this.id = uuid()
    }
  }

  static fromResult(result): Participant {
    return new Participant(result.name, result.id)
  }
}

export default Participant
