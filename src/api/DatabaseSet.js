import Database from './Database';
// import _ from 'lodash';
import sentry from '../api/sentry';
import queryLibrary from './data/queries/query-library';
import neo4j from './driver';

const REFRESH_INTERVAL = 5000;

/**
 * This class is a wrapper for a set of ClusterMember objects, and handles housekeeping
 * about keeping them up to date with the evolving cluster state.
 * #operability Neo4j doesn't really expose a "Cluster" abstraction, so this is a part of
 * the abstraction that Halin puts on top to make all of this possible.
 */
export default class DatabaseSet {
    constructor() {
        this.dbs = [];

        // This tells us whether or not to poll update.  If it's a multidb system
        // we should.  If it isn't, there's no point in polling for updates.
        this.multiDB = true;
        this.timeout = null;
    }

    databases() { return this.dbs; }

    shutdown() {
        clearTimeout(this.timeout);
        return true;
    }

    getDatabaseByName(name) {
        return this.databases().filter(db => db.name === name)[0];
    }

    getDefaultDatabase() {
        return this.databases().filter(db => db.isDefault())[0];
    }

    scheduleRefresh(halin) {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // You don't need to refresh singledb databases, there's only one stub entry
        if (!this.multiDB) {
            return false;
        }

        this.timeout = setTimeout(() => this.refresh(halin), REFRESH_INTERVAL);
        return this.timeout;
    }

    remove(db) {
        let idx = -1;

        for(let i=0; i<this.dbs.length; i++) {
            if (this.dbs[i].getLabel() === db.getLabel()) {
                idx = i;
                break;
            }
        }

        if (idx > -1) {
            this.dbs.splice(idx, 1);
        }

        return idx > -1;
    }

    _mergeChanges(halin, newSet) {
        // sentry.fine('MERGE CHANGES', newSet);

        const lookup = (label, set) => set.filter(m => m.getLabel() === label)[0];

        const currentSet = new Set(this.databases().map(m => m.getLabel()));
        const candidateSet = new Set(newSet.map(m => m.getLabel()));

        const exitingDatabases = new Set([...currentSet].filter(id => !candidateSet.has(id)));
        const enteringDatabases = new Set([...candidateSet].filter(id => !currentSet.has(id)));
        const changingDatabases = new Set([...currentSet].filter(id => candidateSet.has(id)));

        const events = [];

        exitingDatabases.forEach(existingLabel => {
            const member = lookup(existingLabel, this.databases());

            events.push({
                message: `Database ${member.getLabel()} exited.`,
                type: 'exit',
                address: 'cluster',
                payload: member.asJSON(),
            });

            this.remove(member);
        });

        enteringDatabases.forEach(enteringLabel => {
            const member = lookup(enteringLabel, newSet);
           
            events.push({
                message: `Database ${member.getLabel()} entered.`,
                type: 'enter',
                address: 'cluster',
                payload: member.asJSON(),
            });

            this.dbs.push(member);
        });

        changingDatabases.forEach(changingLabel => {
            const member = lookup(changingLabel, this.databases());
            const changes = lookup(changingLabel, newSet);
            
            if (member.merge(changes)) {
                events.push({
                    message: `Database ${member.getLabel()} changed status.`,
                    type: 'change',
                    address: 'cluster',
                    payload: member.asJSON(),
                });
            }
        });

        // Add events at the end after the data structures have been changed,
        // so listeners can get the effects.
        events.forEach(event => halin.getClusterManager().addEvent(event));
        return Promise.resolve(true);
    }

    refresh(halin) {
        // sentry.fine('Refreshing database set');

        return halin.getSystemDBWriter().run(queryLibrary.DBMS_4_SHOW_DATABASES, {}, neo4j.SYSTEM_DB)
            .then(results => neo4j.unpackResults(results, {
                required: [
                    'name', 'address', 'role',
                    'requestedStatus', 'currentStatus',
                    'default', 'error',
                ],
            }))
            .then(results => {
                this.multiDB = true;
                return this._mergeChanges(halin, Database.fromArrayOfResults(results));
            })
            .catch(err => {
                const str = `${err}`;

                // If either of these errors happened, no worries, the DB just doesn't support
                // multidatabase and we know what to do.
                // If it's any other error, that's interesting and should be reported as a potential
                // problem.
                const expectedErrors = [
                    'Invalid input',
                    'connected to the database that does not support multiple databases',
                ];

                let isAnExpectedError = expectedErrors.map(err => str.indexOf(err) > -1)
                    .reduce((a, b) => a || b, false);
                if (!isAnExpectedError) {
                    sentry.warn('ClusterManager#getDatabases() returned unexpected error', err);
                } else {
                    // If it was an expected error, that means the database doesn't support
                    // multidb, and we shouldn't poll this.
                    this.multiDB = false;
                }
                
                sentry.info('Pre Neo4j 4.0, all clusters have a single database "neo4j"');
                // Just like we fake single-node Neo4j instances as a cluster of one member,
                // we fake non-multidb clusters as a multi-db of one database.  :)
                return this._mergeChanges(halin, [Database.pre4DummyDatabase(halin)]);
            })
            .finally(() => this.scheduleRefresh(halin));
    }

    initialize(halin) {
        return this.refresh(halin);
    }
}