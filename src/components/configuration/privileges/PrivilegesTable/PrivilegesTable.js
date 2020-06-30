import React, { Component } from 'react';
import CypherDataTable from '../../../data/CypherDataTable/CypherDataTable';
import { Grid, Button } from 'semantic-ui-react';
import uuid from 'uuid';
import moment from 'moment';
import _ from 'lodash';

import api from '../../../../api';
import CSVDownload from '../../../data/download/CSVDownload';
import Explainer from '../../../ui/scaffold/Explainer/Explainer';
import PrivilegeOperation from '../../../../api/cluster/PrivilegeOperation';
import PrivilegeButton from './PrivilegeButton';

const negativeButtonProps = row => ({
    compact: true,
    negative: true,
    size: 'tiny',
    // Do not permit revoking/denying privileges to built-in system roles.
    disabled: api.driver.systemRoles.indexOf(row.role) > -1,
});

const positiveButtonProps = row => _.merge(_.cloneDeep(negativeButtonProps(row)), { negative: null, positive: true });

const makeDisplayColumns = () => {
    const columns = [
        {
            Header: 'Actions',
            id: 'delete',
            minWidth: 70,
            maxWidth: 100,

            // Every row gets "Reverseability" buttons.  If the row shows a grant of
            // permission XYZ, then there will be a revoke/deny button right next to it
            // If the permission shows a deny, then there will be a grant next to it,
            // so that privileges can be easily reversed.
            Cell: ({ row }) => {
                const deny = PrivilegeOperation.fromSystemPrivilege('DENY', row);
                const revoke = PrivilegeOperation.fromSystemPrivilege('REVOKE', row);
                const grant = PrivilegeOperation.fromSystemPrivilege('GRANT', row);

                if (row.access === 'GRANTED') {
                    return (
                        <span>
                            <PrivilegeButton
                                label='Deny'
                                privilege={_.merge({ locked: true }, deny.properties())}
                                icon='lock'
                                button={negativeButtonProps(row)} />
                            <PrivilegeButton
                                label='Revoke'
                                privilege={_.merge({ locked: true }, revoke.properties())}
                                icon='remove circle'
                                button={negativeButtonProps(row)} />
                        </span>
                    );
                }

                return (
                    <PrivilegeButton
                        label='Grant'
                        privilege={_.merge({ locked: true }, grant.properties())}
                        icon='unlock'
                        button={positiveButtonProps(row)} />
                );
            },
        },
    ].concat(_.cloneDeep(api.queryLibrary.DBMS_4_SHOW_PRIVILEGES.columns));

    return columns;
};

class PrivilegesTable extends Component {
    key = uuid.v4();
    query = api.queryLibrary.DBMS_4_SHOW_PRIVILEGES.query;
    displayColumns = makeDisplayColumns();
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

    UNSAFE_componentWillReceiveProps(props) {
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

    render() {
        return (
            <div className="Neo4jPrivileges">
                <h3>Privileges <Explainer knowledgebase='Privileges' /></h3>

                <Grid>
                    <Grid.Row columns={1}>
                        <Grid.Column>
                            <Button.Group size='small'>
                                <PrivilegeButton 
                                    label='Grant'
                                    privilege={{operation:'GRANT'}}
                                    icon='unlock'
                                    button={{primary: true}} />
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
                                selectFilter={[
                                    'access', 'action', 'resource', 
                                    'segment', 'role', 'graph'
                                ]}
                                displayColumns={this.displayColumns}
                                hideMemberLabel={true}
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

export default PrivilegesTable;