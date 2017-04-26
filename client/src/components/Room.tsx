import * as React from 'react';
import { gql, graphql } from 'react-apollo';

import IRoom from '../../../common/interfaces/IRoom';
import IParticipant from '../../../common/interfaces/IParticipant';

interface DataProp {
  loading: boolean;
  room: {
    participants: Array<IParticipant>
  };
};

interface Props {
  roomKey: string;
  participantName: string;
  data?: DataProp;
  subscribeToRoomEvents?: Function;
};

interface State {
  unsubscribe?: Function;
}

class Room extends React.Component<Props, State> {
  componentWillReceiveProps(newProps: Props) {
    // TODO: These null checks are annoying, but I have to make these props
    // optional - otherwise TS will complain when rendering the component without
    // them, even though the graphql HoC will provide them.
    if (!this.props.data || !newProps.data || !newProps.subscribeToRoomEvents) {
      return;
    }

    if (this.props.data.loading && !newProps.data.loading) {
      const unsubscribe = newProps.subscribeToRoomEvents({
        roomKey: this.props.roomKey,
        participantName: this.props.participantName
      });

      this.setState({ unsubscribe });
    }
  }

  componentWillUnmount() {
    if (this.state.unsubscribe) {
      this.state.unsubscribe();
      this.setState({ unsubscribe: undefined });
    }
  }

  render() {
    const { data, roomKey, participantName } = this.props;

    if (!data || data.loading) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <h1>Room: {roomKey}</h1>
        <div>I am: {participantName}</div>
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

const Subscription = gql`
  subscription onRoomEvent($roomKey: String!, $participantName: String!) {
    onRoomEvent(roomKey: $roomKey, voterName: $participantName) {
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

export default graphql(Query, {
  props: props => {
    return {
      ...props,
      subscribeToRoomEvents: (
        { roomKey, participantName }:
        { roomKey: string, participantName: string }
      ) => {
        return props.data.subscribeToMore({
          document: Subscription,
          variables: {
            roomKey,
            participantName
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
})(Room);
