import * as React from 'react';

import './Participant.css';
import IParticipant from '../../../common/interfaces/IParticipant';
import IVote from '../../../common/interfaces/IVote';

interface Props {
  participant: IParticipant;
  vote?: IVote;
  isRevealed: boolean;
}

function Participant({
  participant,
  vote,
  isRevealed
}: Props) {
  const splitName = participant.name.split(' ');
  const nameTag = splitName.length > 1 ?
    splitName.map(word => word[0]).join('') :
    participant.name.slice(0, 2);

  let currentVoteContent;

  if (vote && isRevealed) {
    currentVoteContent = vote.value;
  } else if (vote) {
    currentVoteContent = '?';
  } else {
    currentVoteContent = '...';
  }

  return (
    <div className="participant" title={participant.name}>
      <div>{nameTag}</div>
      <div>{currentVoteContent}</div>
    </div>
  );
}

export default Participant;
