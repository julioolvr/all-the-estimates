import * as React from 'react';
import './App.css';

import IParticipant from '../../common/interfaces/IParticipant';
import Participant from './components/Participant';

const dummyData: Array<IParticipant> = [
  { name: 'Arthur Dent' },
  { name: 'Marvin' }
];

class App extends React.Component<{}, null> {
  render() {
    return (
      <div>
        {dummyData.map(participant => (
          <Participant
            key={participant.name}
            participant={participant} />
        ))}
      </div>
    );
  }
}

export default App;
