import * as React from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { WrapWithApollo } from 'react-apollo/src/graphql';
import { withRouter } from 'react-router-dom';
import * as Sentencer from 'sentencer';

import IParticipant from '../../../common/interfaces/IParticipant';
import './Home.css';

interface State {
  roomKey: string;
  voterName: string;
}

interface Props {
  onRoomJoined: Function;
  joinRoomMutation?: Function;
  history?: {
    push: Function;
  };
}

class Home extends React.Component<Props, State> {
  state = {
    roomKey: Sentencer.make('{{ noun }}-{{ noun }}-{{ noun }}'),
    voterName: ''
  };

  // TODO: Join on enter key pressed
  onJoinClick = () => {
    const { history } = this.props;
    const { voterName, roomKey } = this.state;

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
      });
  }

  render() {
    return (
      <div className="Home">
        <label className="Home--username">
          <div className="Home--username-label">
            Name
          </div>

          <input
            className="Home--username-input"
            placeholder="Your name"
            value={this.state.voterName}
            onChange={e => this.setState({ voterName: e.target.value })}
          />
        </label>

        <label>
          Joining room&nbsp;
          <input
            className="Home--room-input"
            value={this.state.roomKey}
            onChange={e => this.setState({ roomKey: e.target.value })}
          />
        </label>

        <button
          className="Home--join-button"
          onClick={this.onJoinClick}
        >
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

export default compose<
  WrapWithApollo,
  typeof Home,
  typeof Home
>(
  graphql(JoinRoomMutation, { name: 'joinRoomMutation' }),
  withRouter
)(Home);