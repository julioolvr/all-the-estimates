import * as React from 'react';
import { Link } from 'react-router-dom';

interface State {
  roomKey: string;
  voterName: string;
}

class Home extends React.Component<{}, State> {
  state = {
    roomKey: '',
    voterName: ''
  };

  render() {
    return (
      <div>
        <label>
          Room name:
          <input
            value={this.state.roomKey}
            onChange={e => this.setState({ roomKey: e.target.value })}
          />
        </label>

        <label>
          User name:
          <input
            value={this.state.voterName}
            onChange={e => this.setState({ voterName: e.target.value })}
          />
        </label>

        <Link
          to={{
            pathname: `/${this.state.roomKey}`,
            state: { voterName: this.state.voterName }
          }}
        >
          Join
        </Link>
      </div>
    );
  }
}

export default Home;