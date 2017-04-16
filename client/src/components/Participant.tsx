import * as React from 'react';

import './Participant.css';
import IParticipant from '../../../common/interfaces/IParticipant';

function Participant({ participant }: { participant: IParticipant }) {
  const splitName = participant.name.split(' ');
  const nameTag = splitName.length > 1 ?
    splitName.map(word => word[0]).join('') :
    participant.name.slice(0, 2);

  return <div className="participant" title={participant.name}>{nameTag}</div>;
}

export default Participant;
