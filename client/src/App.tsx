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

interface GraphqlType {
  __typename: String;
  key: String;
  id: String;
}

const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions,
  dataIdFromObject: (o: GraphqlType) => {
    if (o.__typename === 'Room') {
      return `Room:${o.key}`;
    }

    return `${o.__typename}:${o.id}`;
  }
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

        req.options.headers.participantid = this.state.participantId;
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
            <Route exact path="/" render={() => {
              return <Home onRoomJoined={this.onRoomJoined} />;
            }} />
            <Route path="/:roomKey" render={({ match, location }) => (
              <Room
                roomKey={match.params.roomKey}
                voterId={location.state.voterId}
              />
            )} />
          </div>
        </Router>
      </ApolloProvider>
    );
  }
}

export default App;
