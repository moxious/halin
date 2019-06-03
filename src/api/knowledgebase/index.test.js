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
        const kz = Object.keys(kb);

        const special = ['links', 'render', 'metricsReference'];

        kz.forEach(k => {
            if (special.indexOf(k) > -1) { return; }

            const entry = kb[k];
            expect(entry).toBeTruthy();

            component = ReactDOM.render(entry,
                document.createElement('div'));
            expect(component).toBeTruthy();
        });
    });

    it('includes a metrics reference', () => {
        const { metricsReference } = kb;
        expect(metricsReference).toBeTruthy();
        expect(metricsReference['neo4j.transaction.active']).toContain('active transactions');
    });
});