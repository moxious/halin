import React, { Component } from 'react';
import CypherDataTable from '../../../data/CypherDataTable/CypherDataTable';
import { Button, Confirm, Grid, Modal, Icon, Popup } from 'semantic-ui-react';
import uuid from 'uuid';
import moment from 'moment';

import api from '../../../../api';
import CSVDownload from '../../../data/download/CSVDownload';
import Explainer from '../../../ui/scaffold/Explainer/Explainer';

const { status, sentry } = api;

class PrivilegesTable extends Component {
    key = uuid.v4();
    query = api.queryLibrary.DBMS_4_SHOW_PRIVILEGES.query;
    displayColumns = [
        // {
        //     Header: 'Actions',
        //     id: 'delete',
        //     minWidth: 70,
        //     maxWidth: 100,
        //     Cell: ({ row }) => (
        //         <span>
        //             {this.deleteUserButton(row)}
        //             {this.changeUserPasswordButton(row)}
        //         </span>
        //     ),
        // },
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

    render() {
        return (
            <div className="Neo4jPrivileges">
                <h3>Privileges <Explainer knowledgebase='Privileges' /></h3>

                <Grid>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <CypherDataTable
                                node={this.props.node}
                                // onUpdate={this.onRecordsUpdate}
                                showPagination={true}
                                query={this.query}
                                database='system'
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