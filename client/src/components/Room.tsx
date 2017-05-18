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

interface OwnProps {
  roomKey: string;
  voterId: string;
  onLeave: Function;
}

interface ApolloProps {
  data?: DataProp;
  subscribeToRoomEvents?: Function;
  leaveRoomMutation?: Function;
  voteMutation?: Function;
  closeVoteMutation?: Function;
  resetVotesMutation?: Function;
}

type Props = OwnProps & ApolloProps;

interface State {
  unsubscribe?: Function;
}

class Room extends React.Component<Props, State> {
  onBeforeUnload = () => {
    this.unsubscribeAndLeave();
  }

  unsubscribeAndLeave() {
    if (this.state.unsubscribe) {
      this.state.unsubscribe();
      this.setState({ unsubscribe: undefined });
      this.props.leaveRoomMutation();
      this.props.onLeave();
    }
  }

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

  componentDidMount() {
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    this.unsubscribeAndLeave();
  }

  render() {
    const { data, roomKey, voterId } = this.props;

    if (!data || data.loading) {
      return <div>Loading...</div>;
    }

    // TODO: If !voterId, show a prompt to join
    const me = data.room.participants.find(participant => participant.id === voterId);

    if (!me) {
      return <div>Loading...</div>;
    }

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
  mutation LeaveRoom($roomKey: String!) {
    leave(roomKey: $roomKey) {
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
        type
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
      type?: 'JOINED' | 'LEFT';

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
                if (subscriptionData.data.onRoomEvent.type === 'JOINED') {
                  newRoom = {
                    ...newRoom,
                    participants: [
                      ...newRoom.participants,
                      subscriptionData.data.onRoomEvent.participant
                    ]
                  };
                }

                if (subscriptionData.data.onRoomEvent.type === 'LEFT') {
                  newRoom = {
                    ...newRoom,
                    participants: newRoom.participants.filter(participant =>
                      participant.id !== subscriptionData.data.onRoomEvent.participant.id)
                  };
                }
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
