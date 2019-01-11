import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import fields from '../data/fields';
import CypherDataTable from '../data/CypherDataTable';
import './Procedures.css';

/**
 * @deprecated by the CypherSurface component
 */
class Procedures extends Component {
    state = {
        query: 'CALL dbms.procedures()',
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
            <div className='Procedures'>
                <h3>Installed Procedures</h3>

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

Procedures.contextTypes = {
    driver: PropTypes.object
};

export default Procedures;