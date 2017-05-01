import * as React from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { WrapWithApollo } from 'react-apollo/src/graphql';

import IRoom from '../../../common/interfaces/IRoom';
import IParticipant from '../../../common/interfaces/IParticipant';

interface DataProp {
  loading: boolean;
  room: {
    participants: Array<IParticipant>
  };
}

interface Props {
  roomKey: string;
  voterName: string;
  data?: DataProp;
  subscribeToRoomEvents?: Function;
  joinRoomMutation?: Function;
  leaveRoomMutation?: Function;
}

interface State {
  unsubscribe?: Function;
}

class Room extends React.Component<Props, State> {
  componentWillReceiveProps(newProps: Props) {
    if (this.props.data.loading && !newProps.data.loading) {
      const unsubscribe = newProps.subscribeToRoomEvents({
        roomKey: this.props.roomKey,
      });

      this.props.joinRoomMutation({
        roomKey: this.props.roomKey,
        voterName: this.props.voterName
      });

      this.setState({ unsubscribe });
    }
  }

  componentWillUnmount() {
    // TODO: This isn't the safest place to do this, it might
    // not be called when abruptly closing the page. I probably
    // need to do it serverside when the subscription dies.
    if (this.state.unsubscribe) {
      this.state.unsubscribe();
      this.setState({ unsubscribe: undefined });
    }

    this.props.leaveRoomMutation({
      roomKey: this.props.roomKey,
      voterName: this.props.voterName
    });
  }

  render() {
    const { data, roomKey, voterName } = this.props;

    if (!data || data.loading) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <h1>Room: {roomKey}</h1>
        <div>I am: {voterName}</div>
        <ul>
          {data.room.participants.map(participant => <li key={participant.name}>{participant.name}</li>)}
        </ul>
      </div>
    );
  }
}

const Query = gql`
  query GetRoom($roomKey: String!) {
    room(key: $roomKey) {
      participants {
        name
      }
    }
  }
`;

const JoinRoomMutation = gql`
  mutation JoinRoom($roomKey: String!, $voterName: String!) {
    join(roomKey: $roomKey, voterName: $voterName) {
      participants {
        name
      }
    }
  }
`;

const LeaveRoomMutation = gql`
  mutation LeaveRoom($roomKey: String!, $voterName: String!) {
    leave(roomKey: $roomKey, voterName: $voterName) {
      participants {
        name
      }
    }
  }
`;

const Subscription = gql`
  subscription onRoomEvent($roomKey: String!) {
    onRoomEvent(roomKey: $roomKey) {
      ... on ParticipantEvent {
        participant {
          name
        }
      }
    }
  }
`;

interface SubscriptionData {
  data?: {
    onRoomEvent: {
      participant: IParticipant
    }
  };
}

export default compose<
  WrapWithApollo,
  WrapWithApollo,
  typeof Room,
  typeof Room
>(
  graphql(Query, {
    props: props => {
      return {
        ...props,
        subscribeToRoomEvents: (
          { roomKey }:
          { roomKey: string }
        ) => {
          return props.data.subscribeToMore({
            document: Subscription,
            variables: {
              roomKey,
            },
            updateQuery: (
              prev: { room: IRoom },
              { subscriptionData }: { subscriptionData: SubscriptionData }
            ) => {
              if (!subscriptionData.data) {
                return prev;
              }

              const newRoom = {
                ...prev.room,
                participants: [
                  ...prev.room.participants,
                  subscriptionData.data.onRoomEvent.participant
                ]
              };

              return { room: newRoom };
            }
          });
        }
      };
    }
  }),
  graphql(JoinRoomMutation, { name: 'joinRoomMutation' }),
  graphql(LeaveRoomMutation, { name: 'leaveRoomMutation' })
)(Room);
