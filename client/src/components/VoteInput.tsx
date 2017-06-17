import * as React from 'react';
import { Button, Input } from 'semantic-ui-react';

import './VoteInput.css';

interface Props {
  onVote: Function;
  value?: number;
  disabled?: boolean;
}

interface State {
  voteValue: number;
}

class VoteInput extends React.Component<Props, State> {
  state = {
    voteValue: this.props.value || 0
  };

  render() {
    const { onVote, disabled = false } = this.props;
    return (
      <div className="VoteInput">
        <Input
          disabled={disabled}
          value={this.state.voteValue}
          onChange={e => {
            let event = e as React.ChangeEvent<HTMLInputElement>;
            this.setState({ voteValue: Number(event.target.value)});
          }}
        />
        <Button
          disabled={disabled}
          onClick={() => onVote(this.state.voteValue)}
        >
          Vote
        </Button>
      </div>
    );
  }
}

export default VoteInput;