import * as React from 'react';

import './VotingIndicator.css';

function VotingIndicator() {
  return (
    <div className="VotingIndicator">
      <span className="VotingIndicator__dot VotingIndicator__dot--first">.</span>
      <span className="VotingIndicator__dot VotingIndicator__dot--second">.</span>
      <span className="VotingIndicator__dot VotingIndicator__dot--third">.</span>
    </div>
  );
}

export default VotingIndicator;