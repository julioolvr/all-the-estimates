import * as React from 'react';
import { gql, graphql } from 'react-apollo';

import IParticipant from '../../../common/interfaces/IParticipant';

interface State {
  voterName: string;
}

interface Props {
  roomKey: string;
  onRoomJoined: Function;
  joinRoomMutation?: Function;
}

class JoinRoomPromps extends React.Component<Props, State> {
  state = {
    voterName: ''
  };

  // TODO: Join on enter key pressed
  onJoinClick = () => {
    const { roomKey } = this.props;
    const { voterName } = this.state;

    this.props.joinRoomMutation({
      variables: { voterName, roomKey },
      refetchQueries: [{
        query: gql`
          query UpdateRoomCache($roomKey: String!) {
            room(key: $roomKey) {
              key
              participants {
                id
                name
              }
            }
          }
        `,
        variables: { roomKey }
      }]
    }).then(({ data: { join: participant }}: { data: { join: IParticipant } }) => {
        return participant;
      })
      .then(participant => {
        this.props.onRoomJoined(participant);
        return participant;
      });
  }

  render() {
    const { roomKey } = this.props;

    return (
      <div>
        <h1>Welcome to room {roomKey}</h1>

        <label>
          Choose a username:
          <input
            value={this.state.voterName}
            onChange={e => this.setState({ voterName: e.target.value })}
          />
        </label>

        <button onClick={this.onJoinClick}>
          Join
        </button>
      </div>
    );
  }
}

const JoinRoomMutation = gql`
  mutation JoinRoom($roomKey: String!, $voterName: String!) {
    join(roomKey: $roomKey, voterName: $voterName) {
      id
      name
    }
  }
`;

export default graphql(JoinRoomMutation, { name: 'joinRoomMutation' })(JoinRoomPromps);