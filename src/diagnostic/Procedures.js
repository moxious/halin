import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import CypherDataTable from '../data/CypherDataTable';

class Procedures extends Component {
    state = {
        query: 'CALL dbms.procedures()',
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
            <div className='Procedures'>
                <h3>Installed Procedures</h3>
                
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

Procedures.contextTypes = {
    driver: PropTypes.object
};

export default Procedures;