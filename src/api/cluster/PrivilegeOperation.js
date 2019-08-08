
/**
 * A Privilege operation represents a change to a privilege in the graph.
 * See Neo4j 4.0 docs on GRANT/DENY/REVOKE, this structure mirrors that.
 */
export default class PrivilegeOperation {
    constructor(props) {
        this.operation = props.operation;
        this.privilege = props.privilege;
        this.database = props.database;
        this.entity = props.entity;
        this.role = props.role;
    }

    validate() {
        let error = null;

        ['operation', 'privilege', 'database', 'entity', 'role'].forEach(key => {
            if (!this[key]) {
                error = `Missing key ${key}`;
            }
        });

        return error;
    }

    buildQuery() {
        const op = this.operation;
        const priv = this.privilege;
        const db = this.database;
        const entity = this.entity;
        const role = this.role;

        const graphToken = (db === '*') ? 'GRAPHS' : 'GRAPH';

        const preposition = (op === 'REVOKE') ? 'FROM' : 'TO';

        return `${op} ${priv} ON ${graphToken} ${db} ${entity} ${preposition} ${role}`;
    }
};