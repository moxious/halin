import React from 'react';
import PropTypes from 'prop-types';
import AlterPrivilegeForm from '../AlterPrivilegeForm/AlterPrivilegeForm';

import { Button, Icon, Modal } from 'semantic-ui-react';

/**
 * A button that can grant/deny/revoke an individual privilege
 */
const PrivilegeButton = (props) => {
    const compact = props.button.size === 'tiny' || props.button.compact;

    const button = compact ?
        <Button {...props.button || {}} icon={props.icon} />
        : <Button {...props.button || {}}><Icon name={props.icon}/>{props.label}</Button>

    return (
        <Modal closeIcon trigger={button}>
            <Modal.Header>{props.label}</Modal.Header>
            <Modal.Content>
                <AlterPrivilegeForm {...props.privilege} />
            </Modal.Content>
        </Modal>
    );
};

PrivilegeButton.props = {
    label: PropTypes.string.isRequired,
    privilege: PropTypes.object.isRequired,
    icon: PropTypes.string.isRequired,
};

export default PrivilegeButton;