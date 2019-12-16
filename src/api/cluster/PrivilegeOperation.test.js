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
        expect(q).toEqual('GRANT TRAVERSE ON GRAPH foo ELEMENTS * TO blorko');
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
        expect(q).toEqual('GRANT WRITE ON GRAPH foo TO blorko');
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

        expect(op.buildQuery()).toEqual('GRANT CREATE INDEX ON DATABASE foo TO blorko');        
    });
});