import React, { Component } from 'react';
import { CSVLink } from 'react-csv';
import _ from 'lodash';
import moment from 'moment';
import { Icon } from 'semantic-ui-react';
import neo4j from '../../driver/index';

// We must convert neo4j ints if present, turn JSON into string,
// and then safely escape that string for CSV
const toCsvString = obj => {
    const intermed = neo4j.handleNeo4jInt(obj);
    return _.isString(intermed) ? intermed : JSON.stringify(intermed);
};

export default class CSVDownload extends Component {
    getButtonText() {
        return this.props.title ? this.props.title : 'Download CSV';
    }

    getFilename() {
        return this.props.filename ? this.props.filename : 
            `Halin-data-${moment.utc().format()}.csv`;
    }

    render() {
        // Pull out display columns, only those with accessors.
        // These are our data fields.  This intentionally skips things like
        // virtual columns which have a Cell renderer defined, but no accessor,
        // meaning that there won't be any data available for that column.
        const accessible = this.props.displayColumns
            .filter(col => col.accessor)
            // Following ReactTable rules, show is default true, but can be
            // toggled off if user sets show=false.
            .filter(col => _.isNil(col.show) || col.show);

        const data = this.props.data.map(obj => {
            // Each object has to be turned into a simple array,
            // ordered by the headers above.
            const row = accessible.map(col => col.accessor)
                .map(accessor => _.get(obj, accessor))
                .map(toCsvString);
            return row;
        });

        // Name the headers according to the column header or accessor.
        const headerRow = accessible.map(col => col.Header || col.accessor);

        const csvData = [headerRow].concat(data);
        // console.log('csvData', csvData);

        return (
            <div className='DownloadCSV'>
                <CSVLink 
                    filename={this.getFilename()}
                    className="ui basic button"
                    data={csvData}>
                    <Icon name="download"/>
                    { this.getButtonText() }
                </CSVLink>
            </div>
        );
    }
};