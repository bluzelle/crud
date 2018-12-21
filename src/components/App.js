import 'babel-polyfill';

import {HashRouter, Route} from 'react-router-dom'
import {Main} from 'components/Main'
import {execute} from "../services/CommandQueueService";
import DaemonSelector from './DaemonSelector'

import {status} from './Metadata';
import {writers} from './Permissioning';


import DevTools from 'mobx-react-devtools';

// Debugging
import {configureDevtool} from 'mobx-react-devtools';

const url_params = window && new URLSearchParams(window.location.search);

configureDevtool({logEnabled: url_params.has('log')});


import {createClient} from '../services/BluzelleService'


@observer
export class App extends Component {

    componentWillMount() {

        this.setState({
            connected: false
        });

    }


    go(ws_url, uuid, pem) {

        const client = createClient({
            entry: ws_url, 
            uuid,
            private_pem: pem,
        });

        
        client.hasDB()
        .then(has => {

            if(!has) {
                return client.createDB();
            }

        }).then(() => client.status())

        .then(s => {

            status.set(s);

            return client.getWriters();

        }).then(w => {

            writers.set(w);

        }).then(() => {

            this.setState({
                connected: true
            });

        }).catch(e => {

            alert('Could not connect to provided websocket.');

            throw e;

        });

    }


    render() {

        return (
            <div style={{height: '100%'}}>
                {/dev-tools/.test(window.location.href) && <DevTools/>}

                {
                    this.state.connected ?
                        <Main/> :
                        <DaemonSelector go={this.go.bind(this)}/>
                }
            </div>
        );
    }
};