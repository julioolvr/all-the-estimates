import * as React from 'react';
import { Button } from 'semantic-ui-react';

import './RoomManagement.css';

interface Props {
  isOpenForVoting: boolean;
  onClose: Function;
  onReset: Function;
}

function RoomManagement({
  isOpenForVoting,
  onClose,
  onReset
}: Props) {
  return (
    <div className="RoomManagement">
      <Button.Group>
        <Button disabled={!isOpenForVoting} onClick={() => onClose()}>Close</Button>
        <Button disabled={isOpenForVoting} onClick={() => onReset()}>Reset</Button>
      </Button.Group>
    </div>
  );
}

export default RoomManagement;