import * as React from 'react';
import { ApolloClient, ApolloProvider, createNetworkInterface } from 'react-apollo';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws';

import './App.css';
// import IParticipant from '../../common/interfaces/IParticipant';
// import Participant from './components/Participant';
import Room from './components/Room';

// TODO: Take from env variable
const wsUrl = 'ws://localhost:3000/subscriptions';

const wsClient = new SubscriptionClient(wsUrl, {
  reconnect: true
});

const networkInterface = createNetworkInterface({
  uri: 'http://localhost:3000/graphql' // TODO: Take from env variable
});

const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
  networkInterface,
  wsClient
);

const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions,
});

class App extends React.Component<{}, null> {
  render() {
    return (
      <ApolloProvider client={client}>
        <Room roomKey="some-room" voterName={`Member ${Math.random()}`} />
      </ApolloProvider>
    );
  }
}

export default App;
