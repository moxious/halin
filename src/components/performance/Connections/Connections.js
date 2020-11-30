import React, { Component} from "react";
import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Button, Confirm, Popup } from 'semantic-ui-react';
import queryLibrary from '../../../api/data/queries/query-library';

import hoc from '../../higherOrderComponents';
import CypherDataTable from '../../data/CypherDataTable/CypherDataTable';
import Explainer from '../../ui/scaffold/Explainer/Explainer';

const age = since => {
    const start = moment.utc(since);
    const now = moment.utc();
    const duration = moment.duration(now.diff(start));
    return Math.floor(duration.asSeconds()) + ' sec';
};

const v3_5_andUp = version =>
    _.get(version, 'major') >= 3 && _.get(version, 'minor') >= 5;
const allVersions = () => true;

class ConnectionKillTrigger extends Component {
    state = { open: false };

    show = () => this.setState({ open: true });
    handleConfirm = () => {
        this.setState({ open: false });
        this.killConnection();
    };
    handleCancel = () => this.setState({ open: false });

    killConnection = () => {
        console.log('Kill ', this.props.conn.connectionId);

        return this.props.member.killConnections([this.props.conn.connectionId])
            .then(res => {
                console.log('Finished killing', _.get(res, 0));
            })
            .catch(err => console.error('ZOMG', err));
    }

    render() {
        const { open } = this.state;

        return (<span>
            <Popup position='right center' content='Kill Connection' trigger={
                <Button negative icon='delete' onClick={this.show} />
            }/>
            <Confirm 
                open={open}
                header='Kill open Connection?'
                cancelButton='Cancel'
                confirmButton="Kill Connection"
                onCancel={this.handleCancel}
                onConfirm={this.handleConfirm}
            />
        </span>)
    }
}

class Connections extends Component {
    state = {
        // The 3.4 version of this query doesn't have as much info, but works.
        query: queryLibrary.DBMS_LIST_CONNECTIONS.getQuery(),
        selected: null,
        columns: [
            {
                Header: 'Actions',
                id: 'actions',
                minWidth: 100,
                maxWidth: 200,
                Cell: e => <ConnectionKillTrigger member={this.props.member} conn={e.row} />,
                appliesTo: allVersions,
            },
            {
                Header: 'ID',
                accessor: 'connectionId',
                show: true,
                appliesTo: allVersions,
            },
            {
                Header: 'Connect Time',
                accessor: 'connectTime',
                style: { textAlign: 'left' },
                show: false,
                appliesTo: allVersions,
            },
            {
                Header: 'Age',
                Cell: ({ row }) => age(_.get(row, 'connectTime')),
                appliesTo: allVersions,
            },
            {
                Header: 'Connector',
                accessor: 'connector',
                appliesTo: allVersions,
            },
            {
                Header: 'Username',
                accessor: 'username',
                appliesTo: v3_5_andUp,
            },
            {
                Header: 'User Agent',
                accessor: 'userAgent',
                appliesTo: allVersions,
            },
            {
                Header: 'Server Address',
                accessor: 'serverAddress',
                appliesTo: allVersions,
            },
            {
                Header: 'Client Address',
                accessor: 'clientAddress',
                appliesTo: allVersions,
            }
        ],
        rate: 1000,
    };

    allowKillConnections() {
        return window.halinContext.userIsAdmin() && v3_5_andUp(window.halinContext.getVersion());
    }

    open = (row) => {
        this.setState({ selected: row });
    };

    render() {
        return (
            <div className="Connections">
                <h3>Connections <Explainer knowledgebase='Connections' /></h3>
                <CypherDataTable
                    allowDownloadCSV={true}
                    node={this.props.member}
                    query={this.state.query}
                    allowColumnSelect={false}
                    sortable={true}
                    defaultPageSize={10}
                    // Build unique selection filters for these columns
                    selectFilter={['connector', 'userAgent', 'clientAddress', 'serverAddress', 'username']}
                    refresh={this.state.childRefresh}
                    displayColumns={this.state.columns}
                    rate={this.rate}
                />
            </div>
        );
    }
}

Connections.props = {
    member: PropTypes.object.isRequired,
};

export default hoc.enterpriseOnlyComponent(Connections, 'Connections');