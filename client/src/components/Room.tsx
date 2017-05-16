import * as React from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { WrapWithApollo } from 'react-apollo/src/graphql';

import VoteInput from './VoteInput';

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
  voterId: string;
  currentParticipant?: IParticipant;
  data?: DataProp;
  subscribeToRoomEvents?: Function;
  leaveRoomMutation?: Function;
  voteMutation?: Function;
}

interface State {
  unsubscribe?: Function;
}

class Room extends React.Component<Props, State> {
  sendVote = value => {
    this.props.voteMutation({
      variables: {
        roomKey: this.props.roomKey,
        value
      }
    });
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props.data.loading && !newProps.data.loading) {
      const unsubscribe = newProps.subscribeToRoomEvents({
        roomKey: this.props.roomKey,
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
      voterId: this.props.voterId
    });
  }

  render() {
    const { data, roomKey, voterId } = this.props;

    if (!data || data.loading) {
      return <div>Loading...</div>;
    }

    // TODO: If !voterId, show a prompt to join
    const me = data.room.participants.find(participant => participant.id === voterId);
    const myVote = data.room.votes.find(vote => vote.participant.id === me.id);

    return (
      <div>
        <h1>Room: {roomKey}</h1>
        <div>I am: {me.name}</div>
        <VoteInput disabled={!!myVote} onVote={this.sendVote} />
        <ul>
          {data.room.participants.map(participant => {
            const vote = data.room.votes.find(roomVote => roomVote.participant.id === participant.id);

            return (
              <li key={participant.id}>
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

      ... on VoteEvent {
        vote {
          id
          value
          participant {
            id
          }
        }
      }
    }
  }
`;

interface SubscriptionData {
  data?: {
    onRoomEvent: {
      participant?: IParticipant;
      vote?: IVote;
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
              const { room }: { room: IRoom } = prev;

              if (!subscriptionData.data) {
                return prev;
              }

              let newRoom = room;

              if (subscriptionData.data.onRoomEvent.participant) {
                newRoom = {
                  ...newRoom,
                  participants: [
                    ...room.participants,
                    subscriptionData.data.onRoomEvent.participant
                  ]
                };
              }

              if (subscriptionData.data.onRoomEvent.vote) {
                newRoom = {
                  ...newRoom,
                  votes: [
                    ...room.votes,
                    subscriptionData.data.onRoomEvent.vote
                  ]
                };
              }

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
  graphql(LeaveRoomMutation, { name: 'leaveRoomMutation' }),
)(Room);
