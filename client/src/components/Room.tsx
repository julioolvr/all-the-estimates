import * as React from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { WrapWithApollo } from 'react-apollo/src/graphql';

import IRoom from '../../../common/interfaces/IRoom';
import IParticipant from '../../../common/interfaces/IParticipant';
import IVote from '../../../common/interfaces/IVote';

interface DataProp {
  loading: boolean;
  room: {
    participants: Array<IParticipant>,
    votes: Array<IVote>
  };
}

interface Props {
  roomKey: string;
  voterName: string;
  onRoomJoined: Function;
  currentParticipant?: IParticipant;
  data?: DataProp;
  subscribeToRoomEvents?: Function;
  joinRoomMutation?: Function;
  leaveRoomMutation?: Function;
  voteMutation?: Function;
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
      }).then(({ data: { join: participant } }) => this.props.onRoomJoined(participant))
        .then(() => this.props.voteMutation({ variables: { roomKey: this.props.roomKey, value: 5 } }));

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
          {data.room.participants.map(participant => {
            const vote = data.room.votes.find(vote => vote.participant.id === participant.id);

            return (
              <li key={participant.name}>
                {participant.name}
                {vote && <span>({vote.value})</span>}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

const Query = gql`
  query GetRoom($roomKey: String!) {
    room(key: $roomKey) {
      key
      participants {
        id
        name
      }

      votes {
        id
        value

        participant {
          id
        }
      }
    }
  }
`;

const JoinRoomMutation = gql`
  mutation JoinRoom($roomKey: String!, $voterName: String!) {
    join(roomKey: $roomKey, voterName: $voterName) {
      id
      name
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

const VoteMutation = gql`
  mutation Vote($roomKey: String!, $value: Int!) {
    vote(roomKey: $roomKey, value: $value) {
      id
      value
      participant {
        id
      }
    }
  }
`;

const Subscription = gql`
  subscription onRoomEvent($roomKey: String!) {
    onRoomEvent(roomKey: $roomKey) {
      ... on ParticipantEvent {
        participant {
          id
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
              prev,
              { subscriptionData }: { subscriptionData: SubscriptionData }
            ) => {
              const { room } : { room: IRoom } = prev;

              if (!subscriptionData.data) {
                return prev;
              }

              const newRoom = {
                ...room,
                participants: [
                  ...room.participants,
                  subscriptionData.data.onRoomEvent.participant
                ]
              };

              return {
                ...prev,
                room: newRoom
              };
            }
          });
        }
      };
    }
  }),
  graphql(VoteMutation, {
    name: 'voteMutation',
    options: ({ roomKey }) => ({
      refetchQueries: [{
        query: gql`
          query UpdateRoomCache($roomKey: String!) {
            room(key: $roomKey) {
              key
              votes {
                id
                value

                participant {
                  id
                }
              }
            }
          }
        `,
        variables: { roomKey }
      }]
    })
  }),
  graphql(JoinRoomMutation, { name: 'joinRoomMutation' }),
  graphql(LeaveRoomMutation, { name: 'leaveRoomMutation' }),
)(Room);
