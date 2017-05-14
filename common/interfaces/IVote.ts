import IParticipant from './IParticipant';

interface IVote {
  id?: string;
  participant: IParticipant;
  value: number;
}

export default IVote;
