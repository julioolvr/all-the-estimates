import * as React from 'react';

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
      <div>
        My vote:
        <input
          disabled={disabled}
          value={this.state.voteValue}
          onChange={e => this.setState({ voteValue: Number(e.target.value) })}
        />
        <button
          disabled={disabled}
          onClick={() => onVote(this.state.voteValue)}
        >
          Vote
        </button>
      </div>
    );
  }
}

export default VoteInput;