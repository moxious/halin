import JMX_ALL from './jmx/all';
import JMX_GARBAGE_COLLECTOR from './jmx/garbageCollector';
import LIST_TRANSACTIONS from './jmx/listTransactions';
import JMX_MEMORY_STATS from './jmx/memoryStats';
import OS_LOAD_STATS from './jmx/osLoadStats';
import OS_MEMORY_STATS from './jmx/osMemoryStats';
import OS_OPEN_FDS from './jmx/osOpenFDs';
import JMX_PAGE_CACHE from './jmx/pageCache';
import JMX_STORE_SIZES from './jmx/storeSizes';
import JMX_TRANSACTIONS from './jmx/transactions';

import PING from './basic/ping';
import CLUSTER_ROLE from './cluster/role';
import GET_CONSTRAINTS from './schema/constraints';

import LIST_METRICS from './metrics/list';
import GET_METRIC from './metrics/get';
import APOC_STORAGE_METRIC from './metrics/storageMetric';
import DB_QUERY_STATS from './dbStats/query';

import DBMS_COMPONENTS from './dbms/components';

/**
 * A collection of queries that other components can refer to.  By using the same
 * queries with various data feeds, they can be reused and centralized.
 */
export default {
    PING,
    CLUSTER_ROLE,
    GET_CONSTRAINTS,
    JMX_ALL,
    JMX_STORE_SIZES,
    JMX_PAGE_CACHE,
    JMX_MEMORY_STATS,
    JMX_GARBAGE_COLLECTOR,
    JMX_TRANSACTIONS,
    OS_OPEN_FDS,
    OS_LOAD_STATS,
    OS_MEMORY_STATS,
    LIST_TRANSACTIONS,
    LIST_METRICS,
    GET_METRIC,
    APOC_STORAGE_METRIC,
    DB_QUERY_STATS,

    DBMS_COMPONENTS,
};