import _ from 'lodash';
// import sentry from '../../api/sentry';

const dbOps = {
    ACCCESS: 'ACCESS',
    START: 'START',
    STOP: 'STOP',
    CREATE_INDEX: 'CREATE INDEX',
    DROP_INDEX: 'DROP INDEX',
    INDEX_MANAGEMENT: 'INDEX MANAGEMENT',
    CREATE_CONSTRAINT: 'CREATE CONSTRAINT',
    DROP_CONSTRAINT: 'DROP CONSTRAINT',
    CONSTRAINT_MANAGEMENT: 'CONSTRAINT MANAGEMENT',
    CREATE_LABEL: 'CREATE NEW NODE LABEL',
    CREATE_RELATIONSHIP: 'CREATE NEW RELATIONSHIP TYPE',
    CREATE_PROPERTY: 'CREATE NEW PROPERTY NAME',
    NAME_MANAGEMENT: 'NAME MANAGEMENT',
    ALL: 'ALL DATABASE PRIVILEGES',
};

/**
 * A Privilege operation represents a change to a privilege in the graph.
 * See Neo4j 4.0 docs on GRANT/DENY/REVOKE, this structure mirrors that.
 */
export default class PrivilegeOperation {
    static OPERATIONS = {
        GRANT: 'GRANT',
        REVOKE: 'REVOKE',
        DENY: 'DENY',
    };

    static DATABASE_OPERATIONS = dbOps;

    static PRIVILEGES = {
        TRAVERSE: 'TRAVERSE',
        READ_ALL: 'READ {*}',
        MATCH_ALL: 'MATCH {*}',
        WRITE: 'WRITE',
    };

    static ENTITIES = {
        ALL_NODES: 'NODES *',
        ALL_RELS: 'RELATIONSHIPS *',
        ALL_ELEMENTS: 'ELEMENTS *',
    };

    static VALID_OPERATIONS = ['GRANT', 'REVOKE', 'DENY'];        
    static VALID_PRIVILEGES = ['TRAVERSE', 'READ {*}', 'MATCH {*}', 'WRITE']
        .concat(Object.values(PrivilegeOperation.DATABASE_OPERATIONS));
    static VALID_ENTITIES = ['NODES *', 'RELATIONSHIPS *', 'ELEMENTS *'];

    constructor(props) {
        this.operation = props.operation;
        this.privilege = props.privilege;
        this.database = props.database;
        this.entity = props.entity;
        this.role = props.role;
    }

    static isDatabaseOperation(priv) {
        return Object.values(PrivilegeOperation.DATABASE_OPERATIONS).indexOf(priv) > -1;
    }

    /**
     * In the construction of certain queries, the entity portion isn't
     * used.  This lets you determine whether the entity portion applies
     * based on the privilege in question.
     * @param {String} priv 
     */
    static allowsEntity(priv) {
        if (priv === 'WRITE' || PrivilegeOperation.isDatabaseOperation(priv)) {
            return false;
        }

        return true;
    }

    properties() {
        return {
            operation: this.operation,
            privilege: this.privilege,
            // TODO: in 4.0 graphs and databases are the same, but this will not persist long
            // term.
            database: this.database || this.graph,
            graph: this.graph,
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
     * of { action, grant, resource, role, segment, graph } into a PrivilegeOperation.
     * 
     * This function lets you take an existing privilege, and easily "undo" it, by applying
     * a different operation to it.
     * 
     * @param {String} operation: one of GRANT, REVOKE, DENY
     * @param {Object} row 
     */
    static fromSystemPrivilege(operation, row) {
        const actionToVerb = a => {
            // #operability the output of show privileges doesn't match actual
            // permissions names when granting, which is confusing.
            const mapping = {
                read: 'READ',
                write: 'WRITE',
                find: 'TRAVERSE',
                create_propertykey: dbOps.CREATE_PROPERTY,
                create_reltype: dbOps.CREATE_RELATIONSHIP,
                create_label: dbOps.CREATE_LABEL,

                drop_constraint: dbOps.DROP_CONSTRAINT,
                constraint_management: dbOps.CONSTRAINT_MANAGEMENT,
                create_constraint: dbOps.CREATE_CONSTRAINT,

                create_index: dbOps.CREATE_INDEX,
                drop_index: dbOps.DROP_INDEX,

                name_management: dbOps.NAME_MANAGEMENT,
                start_database: dbOps.START,
                stop_database: dbOps.STOP,
                access: dbOps.ACCCESS,
            };

            return mapping[a.toLowerCase()] || a.toUpperCase();
        };

        const resourceToWhat = r => {
            // When you say READ (*) the "resource" will appear as "all_properties"
            // When you say TRAVERSE the "resource" will appear as "graph".
            const mapping = {
                graph: '',
                all_properties: '{*}',
            };

            const v = mapping[r];
            if (!_.isNil(v)) { return v; }

            // Resource can be "property(foo, bar)"
            const re = new RegExp('property\\((?<list>.*?)\\)');
            const match = r.match(re);
            if (match && match.groups && match.groups.list) {
                return `(${match.groups.list})`;
            }

            return v ? v : '';
        };

        const verb = actionToVerb(row.action);
        const what = resourceToWhat(row.resource);
        const privilege = what ? `${verb} ${what}` : verb;

        // If you did GRANT MATCH (*) ON foo NODES * TO role
        // That "NODES *" would turn into segment=NODE(*) so we're reversing that mapping
        // to turn what Neo4j gives us with SHOW PRIVILEGES into something that
        // can be used to build a related privilege command.
        const entityFromSegment = s => {
            // Case:  turn "NODE(Foo) => NODES Foo"
            // #operability: grant syntax is NODES{*} but return in the table is NODES(*)
            // which is super annoying to have to translate back and forth, and users
            // may not know the difference.
            const re = new RegExp('(?<element>(NODE|RELATIONSHIP))\\((?<list>.*?)\\)');
            const match = s.match(re);
            if (match && match.groups && match.groups.list) {
                return `${match.groups.element}S ${match.groups.list}`;
            }

            // Sometimes entity doesn't apply.
            return 'DATABASE';
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
        // sentry.fine('buildQuery', this);
        const op = this.operation;
        const priv = this.privilege;
        const db = this.database;

        // When the entity is 'DATABASE' effectively the entity doesn't apply.
        // For example when GRANT START ON DATABASE FOO TO ROLE
        const entity = this.entity === 'DATABASE' ? '' : this.entity;
        const role = this.role;

        let graphToken = (db === '*') ? 'GRAPHS' : 'GRAPH';

        // #operability when referring to database privileges the syntax is different.
        if (PrivilegeOperation.isDatabaseOperation(priv)) {
            graphToken = 'DATABASE';
        }

        const preposition = (op === 'REVOKE') ? 'FROM' : 'TO';

        /**
         * WRITE does not support ELEMENTS
         * https://neo4j.com/docs/cypher-manual/4.0-preview/administration/security/subgraph/#administration-security-subgraph-write
         */
        if (priv.indexOf('WRITE') > -1) {
            return `${op} ${priv} ON ${graphToken} ${db} ${preposition} ${role}`;
        } else if(Object.values(PrivilegeOperation.DATABASE_OPERATIONS).indexOf(priv) > -1) {
            return `${op} ${priv} ON DATABASE ${db} ${preposition} ${role}`;
        }

        return `${op} ${priv} ON ${graphToken} ${db} ${entity} ${preposition} ${role}`;
    }
};