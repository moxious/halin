import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import fields from '../data/fields';
import CypherDataTable from '../data/CypherDataTable';
import './Functions.css';

class Functions extends Component {
    state = {
        query: 'CALL dbms.functions()',
        displayColumns: [
            {
                Header: 'Name',
                accessor: 'name',
                style: { whiteSpace: 'unset' }
            },
            {
                Header: 'Signature',
                accessor: 'signature',
                style: { whiteSpace: 'unset' }
            },
            {
                Header: 'Description',
                accessor: 'description',
                style: { whiteSpace: 'unset' }
            },
            {
                Header: 'Roles',
                accessor: 'roles',
                Cell: fields.jsonField,
                style: { whiteSpace: 'unset' },
                show: false,
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
                    driver={this.props.driver}
                    node={this.props.node}
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