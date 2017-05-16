import * as React from 'react';

interface Props {
  onVote: Function;
  disabled?: boolean;
}

interface State {
  voteValue: Number;
}

class VoteInput extends React.Component<Props, State> {
  state = {
    voteValue: 0
  };

  render() {
    const { onVote, disabled = false } = this.props;
    return (
      <div>
        My vote:
        <input
          disabled={disabled}
          value={this.state.voteValue}
          onChange={e => this.setState({ voteValue: Number(e.target.value) })}
        />
        <button disabled={disabled} onClick={() => onVote(this.state.voteValue)}>Vote</button>
      </div>
    );
  }
}

export default VoteInput;