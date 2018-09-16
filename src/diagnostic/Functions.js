import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import CypherDataTable from '../data/CypherDataTable';

class Functions extends Component {
    state = {
        query: 'CALL dbms.functions()',
        displayColumns: [
            {
                Header: 'Name',
                accessor: 'name',
            },
            {
                Header: 'Signature',
                accessor: 'signature',
            },
            {
                Header: 'Description',
                accessor: 'description',
            },
            {
                Header: 'Roles',
                accessor: 'roles',
                Cell: CypherDataTable.jsonField,
            },
        ],
    };

    constructor(props, context) {
        super(props, context);
        this.driver = props.driver || context.driver;
    }

    render() {
        return (
            <div className='Functions'>
                <h3>Installed Functions</h3>
                
                <CypherDataTable
                    showPagination={true}
                    query={this.state.query}
                    rate={1000 * 60 * 60} /* Very slow, barely ever, this stuff doesn't change */
                    refresh={this.state.childRefresh}
                    displayColumns={this.state.displayColumns}
                />
            </div>
        );
    }
}

Functions.contextTypes = {
    driver: PropTypes.object
};

export default Functions;