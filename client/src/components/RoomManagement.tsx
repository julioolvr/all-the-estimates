import * as React from 'react';

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
    <div>
      <button disabled={!isOpenForVoting} onClick={() => onClose()}>Close</button>
      <button disabled={isOpenForVoting} onClick={() => onReset()}>Reset</button>
    </div>
  );
}

export default RoomManagement;