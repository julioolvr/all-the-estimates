import * as React from 'react';
import { Card as SemanticCard } from 'semantic-ui-react';

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
    currentVoteContent = <div className="Card__content">{vote.value}</div>;
  } else if (vote) {
    currentVoteContent = <div className="Card__content">?</div>;
  } else {
    currentVoteContent = <VotingIndicator />;
  }

  return (
    <SemanticCard className={['Card', className].join(' ')}>
      <SemanticCard.Content className="Card__container">
        <div className="Card__card">
          {currentVoteContent}
        </div>
      </SemanticCard.Content>
      <SemanticCard.Content className="Card__participant-name">
        {participant.name}
      </SemanticCard.Content>
    </SemanticCard>
  );
}

export default Card;
