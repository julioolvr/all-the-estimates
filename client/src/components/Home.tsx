import * as React from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { WrapWithApollo } from 'react-apollo/src/graphql';
import { withRouter } from 'react-router-dom';
import * as Sentencer from 'sentencer';
import { Button, Input } from 'semantic-ui-react';

import IParticipant from '../../../common/interfaces/IParticipant';
import './Home.css';

interface State {
  roomKey: string;
  voterName: string;
  loading: boolean;
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
    voterName: '',
    loading: false
  };

  // TODO: Join on enter key pressed
  onJoinClick = () => {
    const { history } = this.props;
    const { voterName, roomKey } = this.state;

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
    return (
      <div className="Home">
        <label className="Home--username">
          <div className="Home--username-label">
            Name
          </div>

          <Input
            className="Home--username-input"
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
            className="Home--room-input"
            value={this.state.roomKey}
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
  typeof Home,
  typeof Home
>(
  graphql(JoinRoomMutation, { name: 'joinRoomMutation' }),
  withRouter
)(Home);