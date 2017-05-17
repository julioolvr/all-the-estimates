import * as React from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { WrapWithApollo } from 'react-apollo/src/graphql';

import VoteInput from './VoteInput';
import RoomManagement from './RoomManagement';
import Participant from './Participant';

import IRoom from '../../../common/interfaces/IRoom';
import IParticipant from '../../../common/interfaces/IParticipant';
import IVote from '../../../common/interfaces/IVote';

interface DataProp {
  loading: boolean;
  room: IRoom;
}

interface Props {
  roomKey: string;
  voterId: string;
  currentParticipant?: IParticipant;
  data?: DataProp;
  subscribeToRoomEvents?: Function;
  leaveRoomMutation?: Function;
  voteMutation?: Function;
  closeVoteMutation?: Function;
  resetVotesMutation?: Function;
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

  closeVote = () => {
    this.props.closeVoteMutation();
  }

  resetVotes = () => {
    this.props.resetVotesMutation();
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
        <VoteInput
          disabled={!data.room.openForVoting}
          onVote={this.sendVote}
          value={myVote ? myVote.value : undefined}
        />
        <RoomManagement
          isOpenForVoting={data.room.openForVoting}
          onClose={this.closeVote}
          onReset={this.resetVotes}
        />
        <ul>
          {data.room.participants.map(participant => {
            const vote = data.room.votes.find(roomVote => roomVote.participant.id === participant.id);

            return (
              <Participant
                key={participant.id}
                vote={vote}
                participant={participant}
                isRevealed={!data.room.openForVoting || participant === me}
              />
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
      openForVoting

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

const CloseVoteMutation = gql`
  mutation CloseVote($roomKey: String!) {
    close(roomKey: $roomKey) {
      key
      openForVoting
    }
  }
`;

const ResetVotesMutation = gql`
  mutation ResetVotes($roomKey: String!) {
    reset(roomKey: $roomKey) {
      key
      openForVoting
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

      ... on StatusEvent {
        room {
          openForVoting
          votes {
            id
            value
            participant {
              id
            }
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
      room?: IRoom;
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

              if (subscriptionData.data.onRoomEvent.room) {
                newRoom = {
                  ...newRoom,
                  ...subscriptionData.data.onRoomEvent.room
                };
              }

              if (subscriptionData.data.onRoomEvent.vote) {
                const existingVote =
                  newRoom.votes.find(vote => vote.id === subscriptionData.data.onRoomEvent.vote.id);

                const prevVotes = existingVote ?
                  newRoom.votes.filter(vote => vote !== existingVote) :
                  newRoom.votes;

                newRoom = {
                  ...newRoom,
                  votes: [
                    ...prevVotes,
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
  graphql(CloseVoteMutation, { name: 'closeVoteMutation' }),
  graphql(ResetVotesMutation, { name: 'resetVotesMutation' })
)(Room);
