import React, { Component } from 'react';
import CypherDataTable from '../../../data/CypherDataTable/CypherDataTable';
import { Grid, Button, Modal } from 'semantic-ui-react';
import uuid from 'uuid';
import moment from 'moment';
import _ from 'lodash';

import api from '../../../../api';
import CSVDownload from '../../../data/download/CSVDownload';
import Explainer from '../../../ui/scaffold/Explainer/Explainer';
import AlterPrivilegeForm from '../AlterPrivilegeForm/AlterPrivilegeForm';
import PrivilegeOperation from '../../../../api/cluster/PrivilegeOperation';

class PrivilegesTable extends Component {
    key = uuid.v4();
    query = api.queryLibrary.DBMS_4_SHOW_PRIVILEGES.query;
    displayColumns = [
        {
            Header: 'Actions',
            id: 'delete',
            minWidth: 70,
            maxWidth: 100,
            Cell: ({ row }) => {
                const buttonProps = { 
                    compact: true, 
                    negative: true, 
                    size: 'tiny',
                    // Do not permit revoking/denying privileges to admin.
                    disabled: row.role === 'admin',
                };

                const deny = PrivilegeOperation.fromSystemPrivilege('DENY', row);
                const revoke = PrivilegeOperation.fromSystemPrivilege('REVOKE', row);

                return (
                    <span>
                        {
                            this.privsButton(
                                'Deny', 
                                _.merge({ locked: true }, deny.properties()),
                                'lock', 
                                buttonProps)
                        }
                        {
                            this.privsButton(
                                'Revoke', 
                                _.merge({ locked: true }, revoke.properties()),
                                'remove circle', 
                                buttonProps)
                        }
                    </span>
                );
            },
        },
    ].concat(api.queryLibrary.DBMS_4_SHOW_PRIVILEGES.columns);

    state = {
        childRefresh: 1,
        refresh: 1,
        message: null,
        error: null,
    };

    refresh(val = (this.state.refresh + 1)) {
        // These are passed by state to child components, updating it, 
        // because child component data table is watching, has the effect to
        // force refresh its data.
        this.setState({
            refresh: val,
            childRefresh: val,
            message: null,
            error: null,
        });
    }

    componentWillReceiveProps(props) {
        // If I receive a refresh signal, copy to child
        // which does data polling.  Man I wish there were a better way.
        const refresh = this.state.refresh;
        if (refresh !== props.refresh) {
            this.refresh(props.refresh);
        }
    }

    onRecordsUpdate = (records /*, component */) => {
        this.setState({ data: records });
    };

    downloadCSVButton() {
        if (!this.state.data || this.state.data.length === 0) {
            return '';
        }

        return (
            <CSVDownload
                title='Download'
                filename={`Halin-neo4j-privileges-${moment.utc().format()}.csv`}
                data={this.state.data}
                displayColumns={this.displayColumns}
            />
        );
    }

    // changePrivs(operation) {
    //     this.setState({
    //         pending: false,
    //         message: null,
    //         error: api.status.message('Not yet supported', `${operation} is coming soon!`),
    //     }, () => api.status.toastify(this));
    // }

    privsButton = (label, privProps, icon, props = {}) => {
        const compact = props.size === 'tiny' || props.compact;

        const button = compact ?
            <Button {...props} icon={icon} />
            : <Button {...props}><i className={'icon ' + icon}></i>{label}</Button>

        return (
            <Modal closeIcon trigger={button}>
                <Modal.Header>{label}</Modal.Header>
                <Modal.Content>
                    <AlterPrivilegeForm {...privProps} />
                </Modal.Content>
            </Modal>
        );
    };

    grantButton() { return this.privsButton('Grant', { operation: 'GRANT' }, 'unlock', { primary: true }); }

    render() {
        return (
            <div className="Neo4jPrivileges">
                <h3>Privileges <Explainer knowledgebase='Privileges' /></h3>

                <Grid>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Button.Group size='small'>
                                {this.grantButton()}
                                {this.downloadCSVButton()}
                            </Button.Group>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <CypherDataTable
                                node={this.props.node}
                                onUpdate={this.onRecordsUpdate}
                                showPagination={true}
                                query={this.query}
                                database={api.driver.SYSTEM_DB}
                                refresh={this.state.childRefresh}
                                defaultPageSize={10}
                                displayColumns={this.displayColumns}
                                hideNodeLabel={true}
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

export default PrivilegesTable;