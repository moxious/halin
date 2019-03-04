import JMX_ALL from './jmx/all';
import JMX_GARBAGE_COLLECTOR from './jmx/garbageCollector';
import JMX_MEMORY_STATS from './jmx/memoryStats';
import OS_LOAD_STATS from './jmx/osLoadStats';
import OS_MEMORY_STATS from './jmx/osMemoryStats';
import OS_OPEN_FDS from './jmx/osOpenFDs';
import JMX_PAGE_CACHE from './jmx/pageCache';
import JMX_STORE_SIZES from './jmx/storeSizes';
import JMX_TRANSACTIONS from './jmx/transactions';

import PING from './basic/ping';
import CLUSTER_ROLE from './cluster/role';
import CLUSTER_OVERVIEW from './cluster/overview';
import GET_CONSTRAINTS from './schema/constraints';

import LIST_METRICS from './metrics/list';
import GET_METRIC from './metrics/get';
import METRICS_CSV_ENABLED from './metrics/csvEnabled';

import APOC_STORAGE_METRIC from './metrics/storageMetric';
import DB_QUERY_STATS from './dbStats/query';
import DB_QUERY_HAS_STATS from './dbStats/hasStats';
import DB_QUERY_STATS_COLLECT from './dbStats/collect';
import DB_QUERY_STATS_STOP from './dbStats/stopCollection';

import DBMS_COMPONENTS from './dbms/components';
import DBMS_AUTH_ENABLED from './dbms/authEnabled';
import DBMS_GET_AUTH_PROVIDER from './dbms/getAuthProvider';
import DBMS_FUNCTIONS from './dbms/functions';
import DBMS_PROCEDURES from './dbms/procedures';
import DBMS_LIST_CONFIG from './dbms/listConfig';
import DBMS_SECURITY_USER_ROLES from './dbms/security/userRoles';
import DBMS_LIST_TRANSACTIONS from './dbms/listTransactions';
import DBMS_LIST_CONNECTIONS from './dbms/listConnections';
import DBMS_LIST_ACTIVE_LOCKS from './dbms/listActiveLocks';

import APOC_LOG_STREAM from './apoc/logStream';
import APOC_VERSION from './apoc/version';

/**
 * A collection of queries that other components can refer to.  By using the same
 * queries with various data feeds, they can be reused and centralized.
 */
export default {
    PING,

    CLUSTER_ROLE,
    CLUSTER_OVERVIEW,

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
    
    LIST_METRICS,
    METRICS_CSV_ENABLED,
    GET_METRIC,
    
    APOC_STORAGE_METRIC,

    DB_QUERY_STATS,
    DB_QUERY_HAS_STATS,
    DB_QUERY_STATS_COLLECT,
    DB_QUERY_STATS_STOP,

    DBMS_COMPONENTS,
    DBMS_AUTH_ENABLED,
    DBMS_GET_AUTH_PROVIDER,
    DBMS_FUNCTIONS,
    DBMS_PROCEDURES,
    DBMS_LIST_CONFIG,
    DBMS_SECURITY_USER_ROLES,
    DBMS_LIST_TRANSACTIONS,
    DBMS_LIST_CONNECTIONS,
    DBMS_LIST_ACTIVE_LOCKS,

    APOC_LOG_STREAM,
    APOC_VERSION,
};