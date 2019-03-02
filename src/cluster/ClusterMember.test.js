import ClusterMember from './ClusterMember';

describe('ClusterMember', function () {
    const fields = {
        id: 'XYZ',
        addresses: [ 'bolt://foo-host:1234' ],
        role: 'LEADER',
        database: 'ABC',        
    };
    const fakeRec = {
        get: field => fields[field],
    };

    it('should be constructable', () => expect(new ClusterMember(fakeRec)).toBe.ok);
});