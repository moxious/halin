import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, Form, Message } from 'semantic-ui-react';

class CreateDatabase extends Component {
    state = {
        open: false,
        name: '',
        pending: false,
    };

    formValid = () => {
        return this.state.name && 
            // Don't allow duplicate names
            window.halinContext.databases().filter(db => db.name === this.state.name).length == 0;
    }

    ok = () => {
        console.log('TODO -- logic to create database named ', this.state.name);
        this.setState({ open: false });
    }
    
    cancel = () => this.setState({ open: false });

    componentWillReceiveProps(props) {
        this.setState({ open: props.open });
    }

    handleChange(field, event) {
        const mod = {};
        mod[field] = event.target.value;
        this.setState(mod);
    }

    render() {
        return (
            <Modal className='CreateDatabaseModal' open={this.state.open}>
                <Modal.Header>Create Database</Modal.Header>
                <Modal.Content>
                    <Form error={this.state.name && !this.formValid()} size='small' style={{ textAlign: 'left' }}>
                        <Form.Input 
                            fluid 
                            disabled={this.state.pending}
                            onChange={e => this.handleChange('name', e)}
                            label='Database Name' />

                        <Message
                            error
                            header='Invalid database name'
                            content={
                                <div>
                                    Database names may consist only of simple letters and numbers,
                                    and may not match any other existing database name.
                                </div>
                            }/>
                    </Form>
                </Modal.Content>

                <Modal.Actions>
                    <Button basic color='red' onClick={this.cancel}>
                        Cancel
                    </Button>
                    <Button basic color='green' disabled={!this.formValid()} onClick={this.ok}>
                        OK
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

CreateDatabase.props = {
    member: PropTypes.object,
};

export default CreateDatabase;