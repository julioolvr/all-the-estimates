import * as React from 'react';
import { ApolloClient, ApolloProvider, createNetworkInterface } from 'react-apollo';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws';
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom';

import './App.css';
import Home from './components/Home';
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
        <Router>
          <div>
            <Route exact path="/" component={Home} />
            <Route path="/:roomKey" render={({ match }) => (
              <Room roomKey={match.params.roomKey} voterName={`Member ${Math.random()}`} />
            )} />
          </div>
        </Router>
      </ApolloProvider>
    );
  }
}

export default App;
