import api from './index';

describe('API Entry Point', function() {   
    const members = [
        'HalinContext', 'ClusterMember', 'ClusterManager', 'DataFeed',
        'kb', 'driver', 'queryLibrary', 'sentry',
    ];

    members.forEach(member =>
        it(`exposes ${member}`, () => expect(api[member]).toBeTruthy()));
});