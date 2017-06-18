import * as React from 'react';
import { Card as SemanticCard } from 'semantic-ui-react';

import VotingIndicator from './Card/VotingIndicator';
import VoteInput from './VoteInput';

import './Card.css';

import IParticipant from '../../../common/interfaces/IParticipant';
import IVote from '../../../common/interfaces/IVote';

interface Props {
  participant: IParticipant;
  vote?: IVote;
  isRevealed: boolean;
  isMine: boolean;
  className?: string;
  openForVoting: boolean;
  onVote: Function;
}

function Card({
  participant,
  vote,
  isMine,
  isRevealed,
  openForVoting,
  className = '',
  onVote,
}: Props) {
  let currentVoteContent;

  if (isMine && openForVoting) {
    currentVoteContent = (
      <VoteInput
        disabled={!openForVoting}
        onVote={onVote}
        value={vote ? vote.value : undefined}
      />
    );
  } else if (vote && isRevealed) {
    currentVoteContent = <div className="Card__content">{vote.value}</div>;
  } else if (vote) {
    currentVoteContent = <div className="Card__content">?</div>;
  } else if (isRevealed) {
    currentVoteContent = <div className="Card__content">-</div>;
  } else {
    currentVoteContent = <VotingIndicator />;
  }

  return (
    <SemanticCard className={['Card', className].join(' ')}>
      <SemanticCard.Content className="Card__container">
        <div
          className={['Card__card', isMine && 'Card__card--is-mine'].filter(Boolean).join(' ')}>
          {currentVoteContent}
        </div>
      </SemanticCard.Content>
      <SemanticCard.Content
        className={['Card__participant-name', isMine && 'Card__participant-name--is-mine'].filter(Boolean).join(' ')}>
        {participant.name}
      </SemanticCard.Content>
    </SemanticCard>
  );
}

export default Card;
