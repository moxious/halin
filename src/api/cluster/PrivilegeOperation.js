import _ from 'lodash';

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
        const actionToVerb = a => {
            const mapping = {
                read: 'READ',
                write: 'WRITE',
                find: 'TRAVERSE',
            };

            return mapping[a] || a.toUpperCase();
        };

        const resourceToWhat = r => {
            // When you say READ (*) the "resource" will appear as "all_properties"
            // When you say TRAVERSE the "resource" will appear as "graph".
            const mapping = {
                graph: '',
                all_properties: '(*)',
            };

            const v = mapping[r];
            if (!_.isNil(v)) { return v; }

            // Resource can be "property(foo, bar)"
            const re = new RegExp('property\\((?<list>.*?)\\)');
            const match = r.match(re);
            if (match && match.groups && match.groups.list) {
                return `(${match.groups.list})`;
            }

            return v;
        };

        const verb = actionToVerb(row.action);
        const what = resourceToWhat(row.resource);
        const privilege = `${verb} ${what}`;

        // If you did GRANT MATCH (*) ON foo NODES * TO role
        // That "NODES *" would turn into segment=NODE(*) so we're reversing that mapping
        // to turn what Neo4j gives us with SHOW PRIVILEGES into something that
        // can be used to build a related privilege command.
        const entityFromSegment = s => {
            const mapping = {
                'NODE(*)': 'NODES *',
                'RELATIONSHIP(*)': 'RELATIONSHIPS *',
            };

            if (mapping[s]) { return mapping[s]; }

            // Case:  turn "NODE(Foo) => NODES Foo"
            const re = new RegExp('(?<element>(NODE|RELATIONSHIP))\\((?<list>.*?)\\)');
            const match = s.match(re);
            if (match && match.groups && match.groups.list) {
                return `${match.groups.element}S ${match.groups.list}`;
            }

            return mapping[s] || s;
        };

        const props = {
            operation,
            database: row.graph,
            entity: entityFromSegment(row.segment),
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