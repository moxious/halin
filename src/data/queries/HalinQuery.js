import _ from 'lodash';

export default class HalinQuery {
    constructor(props) {
        if (!props.query || !props.columns) {
            throw new Error('All queries require columns and query');
        }

        this.query = props.query;
        this.columns = props.columns;
        this.dependency = props.dependency || null;
        this.rate = props.rate || 1000;
        this.parameters = props.parameters || {};
    }
};
