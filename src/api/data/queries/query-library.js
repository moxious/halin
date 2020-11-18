import _ from 'lodash';

import JMX_ALL from './jmx/all';
import JMX_GARBAGE_COLLECTOR from './jmx/garbageCollector';
import JMX_MEMORY_STATS from './jmx/memoryStats';
import OS_LOAD_STATS from './jmx/osLoadStats';
import OS_MEMORY_STATS from './jmx/osMemoryStats';
import OS_OPEN_FDS from './jmx/osOpenFDs';
import JMX_PAGE_CACHE from './jmx/pageCache';
import JMX_STORE_SIZES from './jmx/storeSizes';
import JMX_DISK_UTILIZATION from './jmx/diskUtilization';
import JMX_TRANSACTIONS from './jmx/transactions';
import JMX_LAST_TRANSACTION_ID from './jmx/lastCommittedTx';

import JMX_4_TOTAL_STORE_SIZE from './jmx/4.0/totalStoreSize';

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
import DBMS_GET_MAX_HEAP from './dbms/getMaxHeap';
import DBMS_FUNCTIONS from './dbms/functions';
import DBMS_PROCEDURES from './dbms/procedures';
import DBMS_LIST_CONFIG from './dbms/listConfig';
import DBMS_LIST_INDEXES from './dbms/listIndexes';
import DBMS_SECURITY_USER_ROLES from './dbms/security/userRoles';
import DBMS_LIST_TRANSACTIONS from './dbms/listTransactions';
import DBMS_LIST_CONNECTIONS from './dbms/listConnections';
import DBMS_LIST_ACTIVE_LOCKS from './dbms/listActiveLocks';

import DBMS_35_TASKS from './dbms/3.5/tasks';
import DBMS_34_TASKS from './dbms/3.4/tasks';

import DBMS_4_SHOW_DATABASES from './dbms/4.0/showDatabases';
import DBMS_4_START_DATABASE from './dbms/4.0/startDatabase';
import DBMS_4_STOP_DATABASE from './dbms/4.0/stopDatabase';
import DBMS_4_CREATE_DATABASE from './dbms/4.0/createDatabase';
import DBMS_4_DROP_DATABASE from './dbms/4.0/dropDatabase';
import DBMS_4_SHOW_PRIVILEGES from './dbms/4.0/showPrivileges';

import DBMS_4_PAGE_CACHE from './dbms/4.0/pageCache';
import DBMS_4_TRANSACTIONS from './dbms/4.0/transactions';

import DBMS_4_2_PAGE_CACHE from './dbms/4.2/pageCache';
import DBMS_4_2_TRANSACTIONS from './dbms/4.2/transactions';

import APOC_LOG_STREAM from './apoc/logStream';
import APOC_VERSION from './apoc/version';
import APOC_COUNT_STORE from './apoc/countStore';

/**
 * A collection of queries that other components can refer to.  By using the same
 * queries with various data feeds, they can be reused and centralized.
 */
const allQueries = {
    PING,

    CLUSTER_ROLE,
    CLUSTER_OVERVIEW,

    GET_CONSTRAINTS,
    
    JMX_ALL,
    JMX_STORE_SIZES,
    JMX_DISK_UTILIZATION,
    JMX_PAGE_CACHE,
    JMX_4_TOTAL_STORE_SIZE,
    DBMS_4_PAGE_CACHE,

    JMX_MEMORY_STATS,
    JMX_GARBAGE_COLLECTOR,
    JMX_TRANSACTIONS,
    DBMS_4_TRANSACTIONS,
    JMX_LAST_TRANSACTION_ID,
    
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
    DBMS_GET_MAX_HEAP,
    DBMS_FUNCTIONS,
    DBMS_PROCEDURES,
    DBMS_LIST_CONFIG,
    DBMS_LIST_INDEXES,
    DBMS_SECURITY_USER_ROLES,
    DBMS_LIST_TRANSACTIONS,
    DBMS_LIST_CONNECTIONS,
    DBMS_LIST_ACTIVE_LOCKS,

    DBMS_34_TASKS,
    DBMS_35_TASKS,

    DBMS_4_SHOW_DATABASES,
    DBMS_4_START_DATABASE,
    DBMS_4_STOP_DATABASE,
    DBMS_4_CREATE_DATABASE,
    DBMS_4_DROP_DATABASE,
    DBMS_4_SHOW_PRIVILEGES,

    DBMS_4_2_PAGE_CACHE,

    APOC_LOG_STREAM,
    APOC_VERSION,
    APOC_COUNT_STORE,
};

/**
 * Load a query for a particular version of Neo4j by name.
 * @param {HalinContext} ctx 
 * @param {String} queryName 
 * @returns {HalinQuery}
 * @throws Error if no query can be found.
 */
const find = (ctx, queryName) => {
    if (allQueries[queryName]) {
        return allQueries[queryName];
    }

    const version = ctx.getVersion();
    const is4 = version.major >= 4;
    const is4_2 = version.major === 4 && version.minor === 2;

    // Version switching to accomodate all of the different incarnations of page cache metrics
    // over time #operability
    if (queryName === 'pageCache') {
        if(is4_2) {
            return DBMS_4_2_PAGE_CACHE;
        }

        return is4 ? DBMS_4_PAGE_CACHE : JMX_PAGE_CACHE;
    }

    if (queryName === 'transactions') {
        if (is4_2) {
            return DBMS_4_2_TRANSACTIONS;
        }
        
        return is4 ? DBMS_4_TRANSACTIONS : JMX_TRANSACTIONS;
    }

    throw new Error('Cannot find query ' + queryName + 
        ' in the query library');
};

export default _.merge({ find }, allQueries);
