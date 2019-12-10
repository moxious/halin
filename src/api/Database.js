import _ from 'lodash';

/**
 * A database is a graph that can be stored within Neo4j.
 * 
 * Multi-database starts with Neo4j >= 4.0.  For versions of Neo4j prior to 4,
 * the HalinContext will fake a single database.
 */

export default class Database {
    constructor(obj) {
        const keys = ['name', 'address', 'role', 'requestedStatus', 'currentStatus',
            'default', 'error'];

        keys.forEach(k => {
            if (_.isNil(obj[k])) {
                throw new Error(`Initializing Database objects requires key ${k}`);
            }
        });

        this.name = obj.name;
        this.requestedStatus = obj.requestedStatus;
        this.currentStatus = obj.currentStatus;
        this.default = obj.default;
        this.error = obj.error;
        this.address = obj.address;
        this.role = obj.role;
    }

    asJSON() {
        return {
            name: this.name,
            address: this.address,
            role: this.role,
            default: this.default,
            requestedStatus: this.requestedStatus,
            currentStatus: this.currentStatus,
            error: this.error,
        };
    }

    getLabel() {
        return this.name;
    }

    isReconciling() {
        return this.currentStatus !== this.requestedStatus;
    }

    getStatus() {
        return this.currentStatus;
    }

    isOnline() { return this.currentStatus === 'online'; }
}