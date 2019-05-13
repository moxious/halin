// import React from 'react';
import ReactDOM from 'react-dom';
import kb from './index';

describe('Knowledge Base', function() {
    let component;
    
    it('exposes links', () => {
        expect(kb.links).toBeInstanceOf(Object);
        expect(kb.links.troubleshootingConnections).toBeTruthy();
    });

    it('has render-able common documentation entries for common topics', () => {
        const kz = [
            'Neo4jConfiguration', 
            'Roles',
            'Users',
            'Diagnostics',
            'ClusterMemory',
            'GarbageCollection',
            'Ping',
            'Memory',
            'PageCache',
        ];

        kz.forEach(k => {
            const entry = kb[k];
            expect(entry).toBeTruthy();

            component = ReactDOM.render(entry,
                document.createElement('div'));
            expect(component).toBeTruthy();
        });
    });
});