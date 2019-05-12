import ClusterMember from './ClusterMember';
import fakes from '../testutils/fakes';
import Ring from 'ringjs';

describe('ClusterMember', function () {
    const host = 'foo-host';
    const boltAddress = `bolt://${host}:7777`;
    const httpAddress = `http://${host}:8888`;
    const entry = {
        id: 'XYZ',
        addresses: [httpAddress, boltAddress],
        role: 'LEADER',
        database: 'ABC',        
    };
    const fakeRecord = fakes.record(entry);
    let c;

    beforeEach(() => {
        c = new ClusterMember(fakeRecord);
    });

    it('can be constructed', () => {
        expect(c.id).toEqual(entry.id);
        expect(c.addresses).toEqual(entry.addresses);
        expect(c.role).toEqual(entry.role);
        expect(c.database).toEqual(entry.database);
    });

    it('exposes getObservations', () => {
        const obs = c.getObservations();
        expect(obs).toBeInstanceOf(Ring);
    });

    it('knows its bolt address', () => expect(c.getBoltAddress()).toEqual(boltAddress));
    it('knows how to label by host', () => expect(c.getLabel()).toEqual(host));
    it('knows how to extract protocols', () => {
        const prots = c.protocols();
        expect(prots).toContain('http');
        expect(prots).toContain('bolt');
    });

    it('keeps stats in observations', () => {
        c.setDriver(fakes.Driver());

        return Promise.all([
            c.run('RETURN true AS value'),
            c.run('RETURN true AS value'),
            c.run('RETURN true AS value'),
        ]).then(() => {
            // Observations is a RingJS ring
            expect(c.getObservations().toArray().length).toEqual(3);
            c.getObservations().toArray().forEach(obs => {
                expect(obs).toHaveProperty('x');
                expect(obs).toHaveProperty('y');
            });
        });
    });
});