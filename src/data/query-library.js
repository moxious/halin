import CypherDataTable from './CypherDataTable';
const cdt = CypherDataTable;

/**
 * A collection of queries that other components can refer to.  By using the same
 * queries with various data feeds, they can be reused and centralized.
 */
export default {
    PING: {
        query: 'RETURN true AS value',
        columns: [ { Header: 'Value', accessor: 'value' } ],
    },

    JMX_PAGE_CACHE: {
        query: `
        CALL dbms.queryJmx('org.neo4j:instance=kernel#0,name=Page cache')
        YIELD attributes 
        WITH 
            attributes.Faults.value as faults, 
            attributes.EvictionExceptions.value as evictionExceptions, 
            attributes.BytesWritten.value as bytesWritten, 
            attributes.Flushes.value as flushes, 
            attributes.UsageRatio.value as usageRatio, 
            attributes.Evictions.value as evictions, 
            attributes.FileUnmappings.value as fileUnmappings, 
            attributes.BytesRead.value as bytesRead, 
            attributes.FileMappings.value as fileMappings, 
            attributes.HitRatio.value as hitRatio 
        RETURN 
            hitRatio, bytesRead, fileMappings, fileUnmappings,
            flushes, usageRatio, bytesWritten, 
            faults, evictions, evictionExceptions`,
        columns: [
            { Header: 'Usage Ratio', accessor: 'usageRatio', Cell: cdt.pctField },
            { Header: 'Hit Ratio', accessor: 'hitRatio', Cell: cdt.pctField },
            { Header: 'Read', accessor: 'bytesRead', Cell: cdt.dataSizeField },
            { Header: 'Written', accessor: 'bytesWritten', Cell: cdt.dataSizeField },

            { Header: 'Faults', accessor: 'faults', Cell: cdt.numField },
            { Header: 'Flushes', accessor: 'flushes', Cell: cdt.numField, show: false },
            { Header: 'Evictions', accessor: 'evictions', Cell: cdt.numField, show: false },

            { Header: 'Eviction Except.', accessor: 'evictionExceptions', Cell: cdt.numField, show: false },
            { Header: 'File Mappings', accessor: 'fileMappings', Cell: cdt.numField, show: false },
            { Header: 'File Unmappings', accessor: 'fileUnmappings', Cell: cdt.numField, show: false },
        ],
    },

    JMX_MEMORY_STATS: {
        query: `
        CALL dbms.queryJmx('java.lang:type=Memory') yield attributes 
        WITH 
            attributes.HeapMemoryUsage as heap, 
            attributes.NonHeapMemoryUsage as nonHeap

        WITH 
            heap.value.properties as heapProps,
            nonHeap.value.properties as nonHeapProps
        
        return 
            heapProps.init as heapInit, 
            heapProps.committed as heapCommitted,
            heapProps.used as heapUsed, 
            heapProps.max as heapMax,
            nonHeapProps.init as nonHeapInit,
            nonHeapProps.committed as nonHeapCommitted,
            nonHeapProps.used as nonHeapUsed,
            nonHeapProps.max as nonHeapMax,
            heapProps.used + nonHeapProps.used as totalMem`,
        columns: [
            { Header: 'Total Memory', accessor: 'totalMem' },
            { Header: 'Heap Used', accessor: 'heapUsed' },
            { Header: 'Heap Committed', accessor: 'heapCommitted' },
            { Header: 'Nonheap Used', accessor: 'nonHeapUsed' },
        ],
    },

    JMX_GARBAGE_COLLECTOR: {
        query: `
        CALL dbms.queryJmx('java.lang:name=G1 Young Generation,type=GarbageCollector') 
        YIELD name, attributes 
        WHERE name =~ '(?i).*garbage.*' 
        WITH attributes.LastGcInfo.value.properties as lastGC 
        
        RETURN 
            lastGC.startTime as startTime,
            lastGC.duration as duration,
            lastGC.GcThreadCount as threadCount
        LIMIT 1`,
        columns: [
            { Header: 'Duration', accessor: 'duration' },
            { Header: 'Thread Count', accessor: 'threadCount' },
        ],
    },

    JMX_TRANSACTIONS: {
        query: `
        CALL dbms.queryJmx("org.neo4j:instance=kernel#0,name=Transactions") 
        YIELD attributes WITH attributes as a 
        RETURN 
            a.NumberOfRolledBackTransactions.value as rolledBack, 
            a.NumberOfOpenTransactions.value as open, 
            a.LastCommittedTxId.value as lastCommittedId, 
            a.NumberOfOpenedTransactions.value as opened, 
            a.PeakNumberOfConcurrentTransactions.value as concurrent, 
            a.NumberOfCommittedTransactions.value as committed`,
        columns: [
            { Header: 'Rolled Back', accessor: 'rolledBack' },
            { Header: 'Open', accessor: 'open' },
        ],
        legendOnlyColumns: [
            { Header: 'Peak Concurrent', accessor: 'concurrent' },
            { Header: 'Opened', accessor: 'opened' },
            { Header: 'Committed', accessor: 'committed' },
            { Header: 'Last Committed', accessor: 'lastCommittedId' },
        ],
    },

    OS_LOAD_STATS: {
        query: `
        CALL dbms.queryJmx('java.lang:type=OperatingSystem') 
        YIELD attributes 
        WITH 
            attributes.SystemLoadAverage as SystemLoad, 
            attributes.ProcessCpuLoad as ProcessLoad 
        RETURN 
            SystemLoad.value as systemLoad, 
            ProcessLoad.value as processLoad`,
        columns: [
            { Header: 'System Load', accessor: 'systemLoad' },
            { Header: 'Process Load', accessor: 'processLoad' },
        ],
    },

    OS_MEMORY_STATS: {
        query: `
            CALL dbms.queryJmx("java.lang:type=OperatingSystem") 
            YIELD attributes 
            WITH
                attributes.OpenFileDescriptorCount.value as fdOpen,
                attributes.MaxFileDescriptorCount.value as fdMax,

                attributes.FreePhysicalMemorySize.value as physFree,
                attributes.TotalPhysicalMemorySize.value as physTotal,

                attributes.CommittedVirtualMemorySize.value as virtCommitted,
                attributes.FreeSwapSpaceSize.value as swapFree,
                attributes.TotalSwapSpaceSize.value as swapTotal,

                attributes.Name.value as osName,
                attributes.Version.value as osVersion,
                attributes.Arch.value as arch,
                attributes.AvailableProcessors.value as processors
            RETURN 
                fdOpen, fdMax,
                physFree, physTotal,
                virtCommitted, swapFree, swapTotal,
                osName, osVersion, arch, processors`,
        columns: [
            { Header: 'Open FDs', accessor: 'fdOpen' },
            { Header: 'Max FDs', accessor: 'fdMax' },
            { Header: 'Physical Memory (Free)', accessor: 'physFree' },
            { Header: 'Physical Memory (Total)', accessor: 'physTotal' },
            { Header: 'Virtual Memory (Committed)', accessor: 'virtCommitted' },
            { Header: 'Swap memory (Free)', accessor: 'swapFree' },
            { Header: 'Swap memory (Total)', accessor: 'swapTotal' },
            { Header: 'OS Name', accessor: 'osName' },
            { Header: 'OS Version', accessor: 'osVersion' },
            { Header: 'Arch', accessor: 'arch' },
            { Header: 'Processors', accessor: 'processors' },
        ],
    },

    LIST_TRANSACTIONS: {
        query: 'call dbms.listTransactions()',
        columns: [
            { Header: 'ID', accessor: 'transactionId' },
            { Header: 'User', accessor: 'username' },
            { Header: 'Metadata', accessor: 'metaData', show: false, Cell: cdt.jsonField },
            { Header: 'Start Time', accessor: 'startTime', show: false },
            { Header: 'Protocol', accessor: 'protocol', show: false },
            { Header: 'Client Addr', accessor: 'clientAddress', show: false },
            { Header: 'Request URI', accessor: 'requestUri', show: false },
            { Header: 'QueryId', accessor: 'currentQueryId', show: false },
            { Header: 'Query', accessor: 'currentQuery', style: { whiteSpace: 'unset', textAlign: 'left' } },
            { Header: 'Locks', accessor: 'activeLockCount', Cell: cdt.numField },
            { Header: 'Status', accessor: 'status' },
            { Header: 'Resource Info', accessor: 'resourceInformation', show: false, Cell: cdt.jsonField },
            { Header: 'Idle', accessor: 'idleTimeMillis', Cell: cdt.timeField, show: false },
            { Header: 'Wait', accessor: 'waitTimeMillis', Cell: cdt.timeField },
            { Header: 'CPU', accessor: 'cpuTimeMillis', Cell: cdt.timeField, show: false },
            { Header: 'Elapsed', accessor: 'elapsedTimeMillis', Cell: cdt.timeField },
            { Header: 'Bytes', accessor: 'allocatedBytes', Cell: cdt.numField, show: false },
            { Header: 'Direct (b)', accessor: 'allocatedDirectBytes', Cell: cdt.numField, show: false },            
            { Header: 'PageHits', accessor: 'pageHits', Cell: cdt.numField },
            { Header: 'PageFaults', accessor: 'pageFaults', Cell: cdt.numField },
        ],
    }
};