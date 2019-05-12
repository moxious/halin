import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import _ from 'lodash';
import './ColumnSelector.css';

export default class ColumnSelector extends Component {
    state = {
        options: [],
        selected: [],
    };

    constructor(props, context) {
        super(props, context);

        if (!props.displayColumns) {
            throw new Error('Must provide displayColumns');
        } else if(!props.onSelect) {
            throw new Error('Must provide onSelect');
        }

        this.onSelect = props.onSelect;
        this.displayColumns = props.displayColumns;
    }

    componentDidMount() {
        const options = this.makeOptions();

        // Get the key of those that are selected.
        const selected = options.filter(opt => opt.selected).map(opt => opt.key);
        this.setState({ options, selected });
    }

    toggleColumns = (event, allSelections) => {
        this.setState({
            selected: allSelections.value,
        })
        return this.onSelect(allSelections.value);
    };

    makeOptions = () => {
        return this.displayColumns.map(col => {
            const option = {};

            // Dropdown items need these fields.
            option.key = col.accessor;
            option.value = col.accessor;
            option.text = col.Header;

            // Selected defaults to true unless specified.
            option.selected = _.isNil(col.show) ? true : col.show;
            return option;
        });        
    };

    render() {
        return ((!_.isNil(this.state.options) && !_.isNil(this.state.selected)) ? 
            <div className='ColumnSelector'>
                <Dropdown fluid multiple selection className='icon' icon='columns' search
                    placeholder='Select Columns'
                    value={this.state.selected}
                    options={this.state.options}
                    onChange={this.toggleColumns}
                />
            </div> : 'Loading...'
        );
    }
}