import * as React from 'react';
import { ApolloClient, ApolloProvider, createNetworkInterface } from 'react-apollo';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws';
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom';

import './App.css';
import JoinRoom from './components/JoinRoom';
import Room from './components/Room';

import IParticipant from '../../common/interfaces/IParticipant';

const HOST_PROTOCOL = process.env.REACT_APP_HOST_PROTOCOL || 'http';
const HOST_PORT     = process.env.REACT_APP_HOST_PORT || 3000;
const HOST_DOMAIN   = process.env.REACT_APP_HOST_DOMAIN || 'localhost';
const WS_PROTOCOL   = process.env.REACT_APP_HOST_WS_PROTOCOL || 'ws';
const WS_PORT       = process.env.REACT_APP_HOST_PORT || 8000;

const hostUrl = `${HOST_PROTOCOL}://${HOST_DOMAIN}:${HOST_PORT}`;
const wsUrl = `${WS_PROTOCOL}://${HOST_DOMAIN}:${WS_PORT}/subscriptions`;

const wsClient = new SubscriptionClient(wsUrl, {
  reconnect: true
});

const networkInterface = createNetworkInterface({
  uri: `${hostUrl}/graphql`
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

  onRoomLeft = () => {
    this.setState({ participantId: null });
  }

  render() {
    return (
      <ApolloProvider client={client}>
        <Router>
          <div className="App">
            <Route
              exact
              path="/"
              render={() => {
                return <JoinRoom onRoomJoined={this.onRoomJoined} />;
              }}
            />
            <Route
              path="/:roomKey"
              render={({ match }) => {
                const { participantId } = this.state;

                if (participantId) {
                  return (
                    <Room
                      roomKey={match.params.roomKey}
                      voterId={participantId}
                      onLeave={this.onRoomLeft}
                    />
                  );
                } else {
                  return (
                    <JoinRoom
                      roomKey={match.params.roomKey}
                      onRoomJoined={this.onRoomJoined}
                    />
                  );
                }
              }}
            />
          </div>
        </Router>
      </ApolloProvider>
    );
  }
}

export default App;
