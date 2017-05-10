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
import IParticipant from '../../common/interfaces/IParticipant';

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

interface State {
  participantId?: string;
}

class App extends React.Component<{}, State> {
  state: State = {};

  componentDidMount() {
    networkInterface.use([{
      applyMiddleware: (req, next) => {
        if (!this.state.participantId) {
          return next();
        }

        if (!req.options.headers) {
          req.options.headers = {};
        }

        req.options.headers.participantId = this.state.participantId;
        next();
      }
    }]);
  }

  onRoomJoined = (participant: IParticipant) => {
    this.setState({ participantId: participant.id });
  }

  render() {
    return (
      <ApolloProvider client={client}>
        <Router>
          <div>
            <Route exact path="/" component={Home} />
            <Route path="/:roomKey" render={({ match, location }) => (
              <Room
                roomKey={match.params.roomKey}
                voterName={location.state.voterName}
                onRoomJoined={this.onRoomJoined}
              />
            )} />
          </div>
        </Router>
      </ApolloProvider>
    );
  }
}

export default App;
