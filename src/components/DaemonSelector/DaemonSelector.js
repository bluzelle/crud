import CenterMiddle from './CenterMiddle'
import {Header} from '../Header/Header'
import {loadingBar} from '../loadingBar';

import fetch from 'isomorphic-fetch';

const uuidv4 = require('uuid/v4');


const connecting = observable(false);


const url_params = window && new URLSearchParams(window.location.search);

@observer
export default class DaemonSelector extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showConfigLoader: false,
            modal: false
        };
    }

    go() {

        if(!this.private_pem) {
            alert('Please upload Bluzelle private key.');
        }

        this.address.value = this.address.value || this.address.placeholder;
        this.contract.value = this.contract.value || this.contract.placeholder;
        this.uuid.value = this.uuid.value || this.uuid.placeholder;


        url_params.set('address', this.address.value);
        url_params.set('contract', this.contract.value);
        url_params.set('uuid', this.uuid.value);

        const new_url_params = location.pathname + '?' + url_params.toString();

        window.history.pushState('', '', new_url_params);


        const address = this.address.value;
        const contract = this.contract.value;
        const uuid = this.uuid.value;
        const private_pem = this.private_pem;
        const public_pem = this.public_pem;

        connecting.set(true);

        this.props.go(address, contract, uuid, private_pem, public_pem).catch(e => {
            connecting.set(false);
        });
    }

    checkEnterKey(ev) {
        ev.keyCode === 13 && this.go();
    }


    selectFile(callback, filename_callback) {

        const input = document.createElement('input');

        input.type = 'file';


        input.onchange = () => {

            if(input.files.length === 0) {
                return;
            }

            if(input.files.length > 1) {
                alert('Please select only one file.')
                return;
            }


            filename_callback(input.files[0].name);

            const URL = window.URL || window.webkitURL;

            const file = input.files[0],
                fileURL = URL.createObjectURL(file);

            fetch(fileURL)
                .then(res => res.arrayBuffer())
                .then(res => {

                    const text = Buffer.from(res).toString();

       
                    const base_64 = text.split(/\n|\r/).filter(s => !s.startsWith('-')).join('');

                    if(base_64.match(/^[A-Za-z0-9+/=]*$/)) {  

                        callback(base_64);

                    } else {

                        alert('Error in parsing file.');

                    }

                })
                .catch(e => { alert('Error in file upload.'); throw e; });

        };


        input.click();
    }

    componentDidMount() {
        this.address.focus();


        if(url_params) {

            url_params.get('address') && (this.address.value = url_params.get('address'));
            url_params.get('contract') && (this.contract.value = url_params.get('contract'));
            url_params.get('uuid') && (this.uuid.value = url_params.get('uuid'));


            // We're disabling this for now, so you have to choose the private key manually each time.

            // if(url_params.get('address') && url_params.get('port') && url_params.get('uuid')) {
            //
            //     this.go();
            //     return;
            //
            // }

        }

    }

    copy() {
        this.uuid.value = this.uuid.placeholder;
        this.uuid.select();
        document.execCommand("copy");
    }

    toggle() {
        this.setState({
            modal: !this.state.modal
        });
    }

    render() {

        return (
            <CenterMiddle>
                <Header/>
                <div onKeyUp={this.checkEnterKey.bind(this)}>
                    <BS.Card style={{marginTop: 20}} header={<h3>Choose a Bluzelle node</h3>}>
                        <div style={{width: 700, padding: 20}}>

                            { this.state.showConfigLoader &&
                                <BS.Alert color="primary">Loading config parameters from Heroku...</BS.Alert>
                            }

                            <BS.Form>

                                <BS.FormGroup row>
                                    <BS.Label sm={3} for="uuid">UUID:</BS.Label>
                                    <BS.Col sm={9}>
                                     <BS.InputGroup>
                                        <BS.Input type="text" name="uuid" placeholder={uuidv4()} innerRef={e => {this.uuid = e;}} />
                                        <BS.InputGroupAddon addonType="append"><BS.Button outline color="secondary" type="button" onClick={() => this.copy()}><i className="fas fa-copy"></i></BS.Button></BS.InputGroupAddon>
                                      </BS.InputGroup>
                                    </BS.Col>
                                </BS.FormGroup>

                                <BS.FormGroup row>
                                    <BS.Label sm={3} for="priv_file">Private Key:</BS.Label>
                                    <BS.Col sm={9}>

                                     <BS.InputGroup>
                                        <BS.InputGroupAddon addonType="prepend">
                                            <BS.Button outline color="primary" type="button" onClick={() => this.selectFile(base64 => {this.private_pem = base64;}, fname => {this.priv_file.value = fname;})}><i className="far fa-hdd"></i></BS.Button>
                                        </BS.InputGroupAddon>

                                        <BS.Input disabled type="text" name="priv_file" innerRef={e => {this.priv_file = e;}} />
                                        <BS.InputGroupAddon addonType="append">
                                            <BS.Button outline color="secondary" type="button" onClick={() => this.toggle()}><i className="far fa-question-circle"></i></BS.Button>
                                        </BS.InputGroupAddon>
                                      </BS.InputGroup>
                                    </BS.Col>
                                </BS.FormGroup>

                                <BS.FormGroup row>
                                    <BS.Label sm={3} for="pub_file">Public Key (Optional):</BS.Label>
                                    <BS.Col sm={9}>

                                     <BS.InputGroup>
                                        <BS.InputGroupAddon addonType="prepend">
                                            <BS.Button outline color="primary" type="button" onClick={() => this.selectFile(base64 => {this.public_pem = base64;}, fname => {this.pub_file.value = fname;})}><i className="far fa-hdd"></i></BS.Button>
                                        </BS.InputGroupAddon>

                                        <BS.Input disabled type="text" name="pub_file" innerRef={e => {this.pub_file = e;}} />
                                      </BS.InputGroup>
                                    </BS.Col>
                                </BS.FormGroup>

                                <hr/>
                                
                                <div style={{marginTop: 10, textAlign: 'center'}}>
                        
                                    <BS.Button 
                                        outline={true}
                                        color="secondary"
                                        style={{width: '100%'}}
                                        onClick={this.go.bind(this)}>Show Ethereum Config</BS.Button>
                                      
                                </div>

                                <hr/>

                                <BS.FormGroup row>
                                    <BS.Label sm={3} for="address">Eth. RPC Address:</BS.Label>
                                    <BS.Col sm={9}>
                                        <BS.Input type="text" name="address" placeholder="ropsten.infura.io/v3/1c197bf729ee454a8ab7f4e80a1ea628" innerRef={e => {this.address = e;}}/>
                                    </BS.Col>
                                </BS.FormGroup>

                                <BS.FormGroup row>
                                    <BS.Label sm={3} for="port">Contract Address:</BS.Label>
                                    <BS.Col sm={9}>
                                        <BS.Input type="text" name="contract" placeholder="0x7FDbE549D8b47b8285ff106E060Eb9C43Fd879e5" innerRef={e => {this.contract = e;}}/>
                                    </BS.Col>
                                </BS.FormGroup>

                                <div style={{marginTop: 10, textAlign: 'center'}}>

                                    <BS.ButtonGroup style={{width: '100%'}}>

                                        <BS.Button
                                            style={{flex:1}}
                                            outline={true}
                                            color="primary"
                                            onClick={this.go.bind(this)}>Ropsten Mainnet</BS.Button>

                                        <BS.Button
                                            style={{flex:1}}
                                            outline={true}
                                            color="secondary"
                                            onClick={this.go.bind(this)}>Ropsten Testnet</BS.Button>


                                        <BS.Button
                                            style={{flex:1}}
                                            outline={true}
                                            color="info"
                                            onClick={this.go.bind(this)}>Localhost</BS.Button>


                                    </BS.ButtonGroup>
                              
                                </div>

                                <hr/>

                                <div style={{marginTop: 10, textAlign: 'center'}}>

                                    { connecting.get() === false ?
                                        <BS.Button 
                                            color="primary"
                                            style={{width: '100%'}}
                                            onClick={this.go.bind(this)}>Go</BS.Button>
                                        :
                                        loadingBar
                                    }
                                </div>

                            </BS.Form>


                            <BS.Modal isOpen={this.state.modal} toggle={() => this.toggle()}>
                              <BS.ModalHeader toggle={() => this.toggle()}>ECDSA Keys</BS.ModalHeader>
                              <BS.ModalBody>
                                <p>Cryptography secures the database content from bad actors. Your identity is a <em>private/public key pair</em>. BluzelleStudio uses your key pair to sign off database operations. The key is only used locally within this webpage; it is never uploaded anywhere.</p>

                                <hr/>

                                <p>Bluzelle uses the elliptic curve digital signature algorithm (<strong>ECDSA</strong>) on the curve <strong>secp256k1</strong> with an <strong>SHA-512</strong> hash.</p>

                                <hr/>

                                <p>Please <a href="https://gitter.im/bluzelle/Lobby">contact us</a> to set up your Bluzelle database.</p>

                                {/*// <hr/>

                                // <p>With OpenSSL installed, run <code>openssl ecparam -name secp256k1 -genkey -noout -out my_private_key.pem</code>. This will write the private key to a file called <code>my_private_key.pem</code>. Upload that file to BluzelleStudio. To emulate different users, use different keys. The file should looks like this:</p>

                                // <div style={{overflow: 'scroll'}}>
                                // <code style={{whiteSpace: 'pre'}}>{'-----BEGIN EC PRIVATE KEY-----\nMHQCAQEEIFNmJHEiGpgITlRwao/CDki4OS7BYeI7nyz+CM8NW3xToAcGBSuBBAAK\noUQDQgAEndHOcS6bE1P9xjS/U+SM2a1GbQpPuH9sWNWtNYxZr0JcF+sCS2zsD+xl\nCcbrRXDZtfeDmgD9tHdWhcZKIy8ejQ==\n-----END EC PRIVATE KEY-----'}</code>
                                // </div>*/}
                              </BS.ModalBody>
                              <BS.ModalFooter>
                              </BS.ModalFooter>
                            </BS.Modal>

                        </div>
                    </BS.Card>
                </div>
            </CenterMiddle>
        );
    }
}
