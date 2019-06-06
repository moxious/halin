import React, { Component } from 'react';
import { Button, Modal, Header } from 'semantic-ui-react';
import TaskDetail from '../TaskDetail';

export default class TaskDetailModal extends Component {
    state = {
        open: false,
    };

    render() {
        const open = () => this.setState({ open: true });

        return (
            <Modal size='fullscreen' closeIcon
                trigger={
                    <Button compact
                        disabled={false}
                        onClick={open}
                        type='submit' icon='info' />
                }>
                <Header>Transaction Detail: {this.props.task.transaction.id}</Header>
                <Modal.Content scrolling>
                    <TaskDetail task={this.props.task} />
                </Modal.Content>
            </Modal>
        );
    }
};