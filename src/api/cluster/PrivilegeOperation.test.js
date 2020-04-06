import PrivilegeOperation from './PrivilegeOperation';

describe('Privilege Operations', function() {
    let op;
    const props = {
        operation: PrivilegeOperation.OPERATIONS.GRANT,
        privilege: PrivilegeOperation.PRIVILEGES.TRAVERSE,
        database: 'foo',
        entity: PrivilegeOperation.ENTITIES.ALL_ELEMENTS,
        role: 'blorko',
    };

    beforeEach(() => {
        op = new PrivilegeOperation(props);
    });

    it('can be constructed', () => {
        expect(op).toBeTruthy();
        expect(op.role).toEqual('blorko');
        expect(op.database).toEqual('foo');
    });

    it('can validate a query', () => {
        expect(op.validate()).toBeFalsy();

        op = new PrivilegeOperation({
            operation: PrivilegeOperation.OPERATIONS.GRANT,
            // MISSING PRIVILEGE
            // privilege: PrivilegeOperation.PRIVILEGES.TRAVERSE,
            database: 'foo',
            entity: PrivilegeOperation.ENTITIES.ALL_ELEMENTS,
            role: 'blorko',
        });

        expect(op.validate()).toEqual('Missing key privilege');
    });

    it('can expose its properties', () => {
        expect(op.properties()).toEqual(props);
    });

    it('can build a query', () => {
        const q = op.buildQuery();
        expect(q).toEqual('GRANT TRAVERSE ON GRAPH `foo` ELEMENTS * TO blorko');
    });

    it('WRITE privileges do not include ELEMENTS part of query', () => {
        op = new PrivilegeOperation({
            operation: PrivilegeOperation.OPERATIONS.GRANT,
            privilege: PrivilegeOperation.PRIVILEGES.WRITE,
            database: 'foo',
            entity: PrivilegeOperation.ENTITIES.ALL_ELEMENTS,
            role: 'blorko',
        });

        const q = op.buildQuery();

        // 4.0 doesn't support write privileges on specific elements:
        // https://neo4j.com/docs/cypher-manual/4.0-preview/administration/security/subgraph/#administration-security-subgraph-write
        expect(q).toEqual('GRANT WRITE ON GRAPH `foo` TO blorko');
    });

    it('can generate GRANTs from existing privileges (database permissions)', () => {
        const op = PrivilegeOperation.fromSystemPrivilege('GRANT', {
            segment: 'database',
            action: 'create_index',
            graph: 'foo',
            access: 'DENIED',
            role: 'blorko',
            resource: '',
        });

        expect(op.buildQuery()).toEqual('GRANT CREATE INDEX ON DATABASE `foo` TO blorko');        
    });

    it('allowsEntity for non-database privileges', () => {
        expect(PrivilegeOperation.allowsEntity(PrivilegeOperation.PRIVILEGES.READ_ALL)).toBeTruthy();
        expect(PrivilegeOperation.allowsEntity(PrivilegeOperation.PRIVILEGES.TRAVERSE)).toBeTruthy();
    });

    it('does not allowEntity for WRITE or Database privileges', () => {
        expect(PrivilegeOperation.allowsEntity(PrivilegeOperation.DATABASE_OPERATIONS.ACCCESS)).toBeFalsy();
        expect(PrivilegeOperation.allowsEntity(PrivilegeOperation.PRIVILEGES.WRITE)).toBeFalsy();
    });

    /**
     * These scenarios are to work out various forms of query generation that needs to
     * happen, and the various quirks of the system command syntax.
     */
    const scenarios = [
        {
            reversalAction: 'DENY',
            op: {
                access: 'GRANTED',
                action: 'access',
                resource: 'database',
                graph: 'neo4j',
                segment: 'database',
                role: 'test',
            },
            expected: 'DENY ACCESS ON DATABASE `neo4j` TO test',
        },
        {
            reversalAction: 'DENY',
            op: {
                access: 'GRANTED',
                action: 'traverse',
                resource: 'graph',
                graph: 'neo4j',
                segment: 'NODE(*)',
                role: 'test',
            },
            expected: 'DENY TRAVERSE ON GRAPH `neo4j` NODES * TO test',
        },
        {
            reversalAction: 'REVOKE',
            op: {
                access: 'GRANTED',
                action: 'create_propertykey',
                resource: 'database',
                graph: 'neo4j',
                segment: 'database',
                role: 'test',
            },
            expected: 'REVOKE CREATE NEW PROPERTY NAME ON DATABASE `neo4j` FROM test',
        },
        {
            reversalAction: 'REVOKE',
            op: {
                access: 'GRANTED',
                action: 'read',
                resource: 'all_properties',
                graph: 'neo4j',
                segment: 'RELATIONSHIP(*)',
                role: 'test',
            },
            expected: 'REVOKE READ {*} ON GRAPH `neo4j` RELATIONSHIPS * FROM test',
        },
        {
            reversalAction: 'GRANT',
            op: {
                access: 'DENIED',
                action: 'read',
                resource: 'all_properties',
                graph: 'neo4j',
                segment: 'NODE(Address)',
                role: 'microuser',
            },
            expected: 'GRANT READ {*} ON GRAPH `neo4j` NODES Address TO microuser',
        },
        {
            reversalAction: 'GRANT',
            op: {
                access: 'DENIED',
                action: 'traverse',
                resource: 'graph',
                graph: 'neo4j',
                segment: 'RELATIONSHIP(PHONE)',
                role: 'microuser',
            },
            expected: 'GRANT TRAVERSE ON GRAPH `neo4j` RELATIONSHIPS PHONE TO microuser',
        },
        {
            reversalAction: 'GRANT',
            op: {
                access: 'DENIED',
                action: 'read',
                resource: 'all_properties',
                graph: '*',
                segment: 'NODE(SSN)',
                role: 'public',
            },
            expected: 'GRANT READ {*} ON GRAPHS * NODES SSN TO public',
        },
    ];

    scenarios.forEach(scenario => {
        it(`Should ${scenario.expected} given ${scenario.reversalAction} of an operation`, () => {
            const op = PrivilegeOperation.fromSystemPrivilege(
                scenario.reversalAction,
                scenario.op);
            
                expect(op.buildQuery()).toEqual(scenario.expected);
        });
    });
});