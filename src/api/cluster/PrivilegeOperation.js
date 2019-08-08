
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

    properties() {
        return {
            operation: this.operation,
            privilege: this.privilege,
            database: this.database,
            entity: this.entity,
            role: this.role,
        };
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

    /**
     * Neo4j reports the privileges back in an awkward schema.  This function turns a row
     * of { action, grant, resource, role, segment, graph } into one of these.
     * @param {String} operation: one of GRANT, REVOKE, DENY
     * @param {Object} row 
     */
    static fromSystemPrivilege(operation, row) {
        const what = row.resource === 'all_properties' ? '(*)' : row.resource;
        const privilege = `${row.action.toUpperCase()} ${what}`;

        const props = {
            operation,
            database: row.graph,
            entity: row.segment,
            role: row.role,
            privilege,
        };

        const op = new PrivilegeOperation(props);

        return op;
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