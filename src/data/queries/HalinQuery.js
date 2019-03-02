import _ from 'lodash';
import pkg from '../../../package.json';

class HalinQuery {
    constructor(props) {
        if (!props.query || !props.columns) {
            throw new Error('All queries require columns and query');
        }

        this.query = HalinQuery.disclaim(props.query);
        this.columns = props.columns;
        this.dependency = props.dependency || null;
        this.rate = props.rate || 1000;
        this.parameters = props.parameters || {};
        this.legendOnlyColumns = props.legendOnlyColumns || [];
    }

    static disclaim(query) {
        if (query.indexOf(HalinQuery.disclaimer) > -1) {
            return query;
        }   
    
        return `WITH ${HalinQuery.disclaimer} ${query}`;
    }
};

HalinQuery.disclaimer = `'This query was run by Halin v${pkg.version}' AS disclaimer\n`;
HalinQuery.transactionConfig = {
    timeout: 5000,
    metadata: {
        app: `halin-v${pkg.version}`,
        type: 'user-direct',
    },
};

export default HalinQuery;
