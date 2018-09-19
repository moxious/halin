import React, { Component } from 'react';
import ReactTable from 'react-table';

export default class Advisor extends Component {
    state = {
        findings: null,
        displayColumns: [
            { Header: 'Level', accessor: 'level' },
            {
                Header: 'Finding',
                accessor: 'finding',
                style: { whiteSpace: 'unset', textAlign: 'left' }
            },
            {
                Header: 'Evidence',
                accessor: 'evidence',
                style: { whiteSpace: 'unset', textAlign: 'left' },
                show: false
            },
            {
                Header: 'Advice',
                accessor: 'advice',
                style: { whiteSpace: 'unset', textAlign: 'left' }
            },
        ],
    };

    render() {
        return (this.props.data ?
            <div className='Advisor'>
                <h3>Advisor Results</h3>

                <p>We have taken an automatic look at your configuration, and have some feedback.</p>

                <ReactTable
                    data={this.props.data}
                    showPagination={true}
                    defaultPageSize={Math.min(this.props.data.length, 10)}
                    columns={this.state.displayColumns} />
            </div> :
            'Loading...'
        );
    }
}