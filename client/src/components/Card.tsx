import * as React from 'react';

import VotingIndicator from './Card/VotingIndicator';

import './Card.css';

import IParticipant from '../../../common/interfaces/IParticipant';
import IVote from '../../../common/interfaces/IVote';

interface Props {
  participant: IParticipant;
  vote?: IVote;
  isRevealed: boolean;
  isMine: boolean;
  className?: string;
}

function Card({
  participant,
  vote,
  isMine,
  isRevealed,
  className = '',
}: Props) {
  let currentVoteContent;

  if (vote && isRevealed) {
    currentVoteContent = vote.value;
  } else if (vote) {
    currentVoteContent = '?';
  } else {
    currentVoteContent = <VotingIndicator />;
  }

  return (
    <div className={['Card', className].join(' ')}>
      <div className={['Card__card', vote && 'Card__card--is-active'].join(' ')}>{currentVoteContent}</div>
      <div className="Card__participant-name">{participant.name}</div>
    </div>
  );
}

export default Card;
