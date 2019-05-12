import React, { Component } from 'react';
import moment from 'moment';
import { Button, Icon } from 'semantic-ui-react';
import _ from 'lodash';

export default class JSONDownload extends Component {
    buildURI = data => {
        const pretty = JSON.stringify(data, null, 2);
        const blob = new Blob([pretty], { type: 'text/json' });
        const dataURI = `data:text/json;chartset=utf-8,${pretty}`;

        const URL = window.URL || window.webkitURL;

        return (typeof URL.createObjectURL === 'undefined') ? 
            dataURI :
            URL.createObjectURL(blob);
    };

    getFilename() {
        return this.props.filename ? 
            this.props.filename : 
            `Halin-data-${moment.utc().format()}.json`;
    }

    getTitle() {
        return this.props.title ? this.props.title : 'Download';
    }

    render() {
        return (
            <Button basic className='JSONDownload'
                disabled={_.isNil(this.props.data)}
                download={this.getFilename()}
                href={this.buildURI(this.props.data)}>
                <Icon name="download" />
                { this.getTitle() }
            </Button>
        );
    }
};