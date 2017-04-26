import IParticipant from './IParticipant';
import IVote from './IVote';

interface IRoom {
  id: string;
  key: string;
  participants: Array<IParticipant>;
  votes: Array<IVote>;
}

export default IRoom;
