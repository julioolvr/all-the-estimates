import IParticipant from './IParticipant';
import IVote from './IVote';

interface IRoom {
  id: string;
  key: string;
  participants: Array<IParticipant>;
  votes: Array<IVote>;
  openForVoting: boolean;
}

export default IRoom;
