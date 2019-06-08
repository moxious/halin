import React, { Component } from "react";
import _ from 'lodash';
import moment from 'moment';

import queryLibrary from '../../../../api/data/queries/query-library';
import fields from '../../../../api/data/fields';

import hoc from '../../../higherOrderComponents';
import CypherDataTable from '../../../data/CypherDataTable/CypherDataTable';
import TaskDetailModal from '../TaskDetailModal/TaskDetailModal';
import Explainer from '../../../ui/scaffold/Explainer/Explainer';
import KillTransaction from '../KillTransaction/KillTransaction';

const age = since => {
    const start = moment.utc(since);
    const now = moment.utc();
    const duration = moment.duration(now.diff(start));
    return duration.asSeconds() + ' sec';
};

const createHiddenColumnFromSubfield = (section, subfield) => {
    const accessor = `${section}.${subfield}`;
    return {
        Header: accessor,
        show: false,
        accessor,
    };
};

const fullClientAddress = ({ row }) => {
    if (_.get(row, 'connection.clientAddress') && _.get(row, 'connection.userAgent')) {
        return ((_.get(row, 'connection.connector') || 'bolt') + '://' +
            _.get(row, 'connection.clientAddress') + ' (' +
            _.get(row, 'connection.userAgent') + ')');
    }

    return 'unknown';
};

const v3_5_andUp = version =>
    _.get(version, 'major') >= 3 && _.get(version, 'minor') >= 5;
const allVersions = () => true;

class Tasks extends Component {
    state = {
        // The 3.4 version of this query doesn't have as much info, but works.
        query: queryLibrary.DBMS_34_TASKS.getQuery(),
        selected: null,
        columns: [
            {
                Header: 'Actions',
                id: 'actions',
                minWidth: 100,
                maxWidth: 200,
                Cell: e => {
                    // TODO: these update dynamically as component refreshes, which isn't
                    // desirable.
                    return (<span>
                        <TaskDetailModal task={e.row} />
                        { this.allowKillTransactions() ? 
                            <KillTransaction 
                                member={this.props.node} 
                                transaction={e.row.transaction} /> : '' }
                    </span>);
                },
                appliesTo: allVersions,
            },
            {
                Header: 'ID',
                accessor: 'transaction.id',
                show: true,
                // Neo4j IDs are things like 'transaction-123' which is redundant and too long to display.
                Cell: ({ row }) => (_.get(row, 'transaction.id') || '').replace(/transaction-/, ''),
                appliesTo: allVersions,
            },
            {
                Header: 'Query',
                accessor: 'query.query',
                style: { textAlign: 'left' },
                show: true,
                appliesTo: allVersions,
            },
            {
                Header: 'Client',
                Cell: fullClientAddress,
                appliesTo: v3_5_andUp,
            },
            {
                Header: 'Username',
                accessor: 'connection.username',
                appliesTo: v3_5_andUp,
            },
            {
                Header: 'Age',
                Cell: ({ row }) => age(_.get(row, 'transaction.startTime')),
                appliesTo: allVersions,
            },
            {
                Header: 'CPU (ms)',
                accessor: 'transaction.cpuTimeMillis',
                Cell: fields.numField,
                appliesTo: allVersions,
            },
            {
                Header: 'Elapsed(ms)',
                accessor: 'transaction.elapsedTimeMillis',
                Cell: fields.numField,
                appliesTo: allVersions,
            },
            {
                Header: 'Idle(ms)',
                accessor: 'transaction.idleTimeMillis',
                Cell: fields.numField,
                appliesTo: allVersions,
            },
            {
                Header: 'Wait(ms)',
                accessor: 'transaction.waitTimeMillis',
                Cell: fields.numField,
                appliesTo: allVersions,
            },
            {
                Header: 'Connection',
                accessor: 'connection',
                show: false,
                excludeFromCSV: true,
                Cell: fields.jsonField,
                appliesTo: v3_5_andUp,
            },
            {
                Header: 'Transaction',
                accessor: 'transaction',
                show: false,
                excludeFromCSV: true,
                Cell: fields.jsonField,
                appliesTo: allVersions,
            },
            {
                Header: 'QueryDetails',
                accessor: 'query',
                show: false,
                excludeFromCSV: true,
                Cell: fields.jsonField,
                appliesTo: allVersions,
            },

            // All fields below this are hidden by default and not
            // shown to the user, but destructured in this way so
            // that saving as CSV works for this nested structure.

            // CONNECTION PROPERTIES
            ...[
                'id', 'connectTime', 'connector',
                'userAgent', 'serverAddress',
                'clientAddress',
            ].map(sf => createHiddenColumnFromSubfield('connection', sf)),

            // TRANSACTION PROPERTIES
            ...[
                'metaData', 'startTime', 'protocol',
                'clientAddress', 'requestUri', 'currentQueryId',
                'currentQuery', 'activeLockCount', 'status',
                'resourceInformation', 'elapsedTimeMillis',
                'cpuTimeMillis', 'waitTimeMillis', 'idleTimeMillis',
            ].map(sf => createHiddenColumnFromSubfield('transaction', sf)),

            ...[
                'id', 'parameters', 'planner', 'runtime',
                'indexes', 'startTime',
                'allocatedBytes', 'pageHits', 'pageFaults',
            ].map(sf => createHiddenColumnFromSubfield('query', sf)),
        ],
        rate: 1000,
    };

    allowKillTransactions() {
        return window.halinContext.userIsAdmin() && v3_5_andUp(window.halinContext.getVersion());
    }

    componentWillMount() {
        // We use a different query according to supported features if 3.5 is present.
        const version = window.halinContext.getVersion();
        let query = queryLibrary.DBMS_34_TASKS.getQuery();
        const columns = this.state.columns.filter(c => {
            if (!c.appliesTo) { return true; }
            return c.appliesTo(version);
        });

        if (version.major >= 3 && version.minor >= 5) {
            query = queryLibrary.DBMS_35_TASKS.getQuery();
        }

        this.setState({ query, columns });
    }

    open = (row) => {
        this.setState({ selected: row });
    };

    render() {
        return (
            <div className="Tasks">
                <h3>Tasks <Explainer knowledgebase='Tasks' /></h3>
                <CypherDataTable
                    allowDownloadCSV={true}
                    node={this.props.node}
                    query={this.state.query}
                    allowColumnSelect={false}
                    sortable={true}
                    defaultPageSize={10}
                    filterable={false}
                    refresh={this.state.childRefresh}
                    displayColumns={this.state.columns}
                    rate={this.rate}
                />
            </div>
        );
    }
}

export default hoc.enterpriseOnlyComponent(Tasks, 'Tasks');