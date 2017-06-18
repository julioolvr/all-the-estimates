import * as React from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { WrapWithApollo } from 'react-apollo/src/graphql';
import { withRouter } from 'react-router-dom';
import * as Sentencer from 'sentencer';
import { Button, Input } from 'semantic-ui-react';

import IParticipant from '../../../common/interfaces/IParticipant';
import './JoinRoom.css';

interface State {
  roomKey: string;
  voterName: string;
  loading: boolean;
}

interface Props {
  onRoomJoined: Function;
  roomKey?: string;
  joinRoomMutation?: Function;
  history?: {
    push: Function;
  };
}

class JoinRoom extends React.Component<Props, State> {
  state = {
    roomKey: Sentencer.make('{{ noun }}-{{ noun }}-{{ noun }}'),
    voterName: '',
    loading: false
  };

  // TODO: Join on enter key pressed
  onJoinClick = () => {
    const { history } = this.props;
    const { voterName } = this.state;
    const roomKey = this.props.roomKey || this.state.roomKey;

    this.setState({ loading: true });

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
      })
      .then(participant => {
        history.push({
          pathname: `/${roomKey}`,
          state: { voterId: participant.id }
        });
      })
      .then(() => this.setState({ loading: false }));
  }

  render() {
    const roomKey = this.props.roomKey || this.state.roomKey;

    return (
      <div className="JoinRoom">
        <label className="JoinRoom--username">
          <div className="JoinRoom--username-label">
            Name
          </div>

          <Input
            className="JoinRoom--username-input"
            placeholder="Your name"
            value={this.state.voterName}
            onChange={e => {
              let event = e as React.ChangeEvent<HTMLInputElement>;
              this.setState({ voterName: event.target.value });
            }}
          />
        </label>

        <label>
          Joining room&nbsp;
          <Input
            transparent
            className="JoinRoom--room-input"
            value={roomKey}
            disabled={!!this.props.roomKey}
            onChange={e => {
              let event = e as React.ChangeEvent<HTMLInputElement>;
              this.setState({ roomKey: event.target.value });
            }}
          />
        </label>

        <Button
          primary
          loading={this.state.loading}
          onClick={this.onJoinClick}
        >
          Join
        </Button>
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

export default compose<
  WrapWithApollo,
  typeof JoinRoom,
  typeof JoinRoom
>(
  graphql(JoinRoomMutation, { name: 'joinRoomMutation' }),
  withRouter
)(JoinRoom);