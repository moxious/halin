import Advice from '../Advice';
import _ from 'lodash';
import neo4j from '../../../driver';
import sentry from '../../../sentry/index';

const memActuals = pkg => {
    const findings = [];

    pkg.halin.dataFeeds
        .filter(df => (df.label === 'OS_MEMORY_STATS' && df.lastObservation))
        .forEach(dataFeed => {
            const addr = dataFeed.address;

            const obs = dataFeed.lastObservation;
            const freeRatio = obs.physFree / obs.physTotal;

            if (!_.isNaN(freeRatio) && freeRatio <= 0.1) {
                findings.push(Advice.warn({
                    addr,
                    finding: 'At time of measurement, your memory utilization was very high',
                    advice: 'Consider looking at memory configuration for your system'
                }));
            }
        });

    return findings;
}

const pageCacheSizing = pkg => {
    const findings = [];
    pkg.nodes.forEach(node => {
        const addr = node.basics.address;
        const pageCache = node.configuration['dbms.memory.pagecache.size'];

        if (!pageCache) {
            sentry.fine('PC bailout; no PC');
            findings.push(Advice.warn({
                addr, 
                finding: 'Because page cache is not set, we cannot evaluate appropriateness of your memory settings',
                advice: 'For best performance, set heap and page cache sizes'
            }));
            return;
        }

        let pageCacheInBytes = 0;
        
        // Stupid reverse math from Xmb, Xgb -> number of bytes.
        const match = pageCache.match(/\s*(\d+)(gb?|mb?|tb)?\s*$/i);
        
        if (match) {
            const base = match[1];
            const sizing = (match[2] || '').toLowerCase();

            // Different human suffixes to abbreviate sizes, and what multiplier that implies
            const multipliers = {
                t: 10**12,
                tb: 10**12,
                g: 10**9,
                gb: 10**9,
                m: 10**6,
                mb: 10**6,
                k: 10**3,
                kb: 10**3,
            };
            
            const multiplier = multipliers[sizing] || 1;
            pageCacheInBytes = base * multiplier;
        } else {
            // In 4.0, value can be 'No Value'; earlier it can be ''
            sentry.fine('PC bailout; size is unspecified or weird: "' + pageCache + '"');
            findings.push(Advice.warn({
                addr, 
                finding: `Cannot determine data sizing of page cache setting ${pageCache}`,
                advice: 'Check your configuration and explicitly configure page cache',
            }));
            return;
        }

        const storeSizes = node.JMX.filter(entry => entry.name === 'org.neo4j:instance=kernel#0,name=Store sizes')[0];

        if (!storeSizes) {
            sentry.fine('PC bailout; no store sizes');
            findings.push(Advice.warn({
                addr,
                finding: 'Unknown store sizes; cannot compute appropriateness of memory/page cache settings',
            }));
            return;
        }

        const totStoreSize = _.get(storeSizes, 'attributes.TotalStoreSize.value');
        const txLogSize = _.get(storeSizes, 'attributes.TransactionLogsSize.value');

        if (totStoreSize) {
            let txSize = 0;
            let bytesOnDisk = 0;

            try {
                // Neo4j JS driver black magic: internally this is a neo4j long which gets coerced to a JS type, which
                // can't handle the full range.  Silent assumption here is that total bytes on disk is representable as a
                // JS number.  Otherwise we'll need a bignum library later.
                txSize = txLogSize ? neo4j.integer.toNumber(txLogSize) : 0;

                // Don't want to count txlogs because they get very big, and people don't put them in page cache.
                bytesOnDisk = neo4j.integer.toNumber(totStoreSize) - txSize;                
            } catch (e) {
                sentry.error('Failed to evaluate disk size', e);
                return;
            }

            const needThisMuch = bytesOnDisk - txSize;
            const tooMuchPageCache = needThisMuch * 1.5;
            const probablyOK = needThisMuch * 0.9;   // 90% or more of your store in memory is pretty good.

            if (pageCacheInBytes >= tooMuchPageCache) {
                findings.push(Advice.warn({
                    addr,
                    finding: `Your page cache setting is more than 50% greater than your store on disk size.
                    Store size=${needThisMuch}, page cache ${pageCacheInBytes} bytes (${pageCache})`,
                    advice: 'You can reduce your page cache size to be more efficient with memory'
                }));
            } else if (pageCacheInBytes >= probablyOK) {
                findings.push(Advice.pass({
                    addr,
                    finding: `Your page cache looks appropriately sized considering your store size on disk`,
                }));
            } else {
                findings.push(Advice.warn({
                    addr,
                    finding: `Your page cache setting is too small considering your store size.
                    Store size=${needThisMuch} bytes, page cache ${pageCacheInBytes} bytes (${pageCache})`,
                    advice: 'Consider increasing your page cache size to improve system performance',
                }));
            }
        }
    });

    return findings;
};

const memSettings = pkg => {
    const settings = [
        'dbms.memory.heap.initial_size',
        'dbms.memory.heap.max_size',
        'dbms.memory.pagecache.size',
    ];

    const findings = [];

    pkg.nodes.forEach(node => {
        let incomplete = false;
        const addr = node.basics.address;

        settings.forEach(setting => {
            const val = node.configuration[setting];

            if (!val) {
                findings.push(Advice.error({
                    addr,
                    finding: `No value specified for ${setting}`, 
                    advice: 'For best performance, these values should be set. Consider running neo4j-admin memrec',
                }));
                incomplete = true;
            }
        });

        if (!incomplete) {
            findings.push(Advice.pass({
                addr, 
                finding: `Found configured memory settings.  Good!`,
            }));
        }

        // Check for initial and max heap size, which should match.
        const initial = node.configuration['dbms.memory.heap.initial_size'];
        const max = node.configuration['dbms.memory.heap.max_size'];

        // Ship's suggestion.  Thanks ship!
        if (initial !== max) {
            findings.push(Advice.warn({
                addr,
                finding: 'Initial heap size and max heap size differ', 
                advice: 'For best performance, these values should match, to prevent rapid heap re-allocation',
            }));
        }
    });

    return findings;
};

export default [
    memSettings, memActuals, pageCacheSizing,
];