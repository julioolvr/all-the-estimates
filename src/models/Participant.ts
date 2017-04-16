class Participant {
  constructor(
    public name: string
  ) {}

  static fromResult(result): Participant {
    return new Participant(result.name)
  }
}

export default Participant
