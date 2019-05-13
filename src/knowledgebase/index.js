import React from 'react';
import _ from 'lodash';

let k = 0;

const render = lines =>
    <div className='KnowledgeBase'>
        {lines.map(l => _.isString(l) ? <p key={`kb${k++}`}>{l}</p> : l)}
    </div>;

const moreinfo = (title, link) =>
    <p key={`kb${k++}`}>For more information, see <a target='halindocs' href={link}>{title}</a></p>;

const links = {
    configReference: moreinfo('Neo4j Configuration Reference',
        'https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/'),
    txManagement: moreinfo('transaction management', 'https://neo4j.com/docs/java-reference/current/transactions/'),
    connectionManagement: moreinfo('connection management', 'https://neo4j.com/docs/operations-manual/current/monitoring/connection-management/'),
    jmxMonitoring: moreinfo('JMX monitoring of the operating system', 'https://neo4j.com/docs/java-reference/current/jmx-metrics/'),
    usersAndRoles: moreinfo('Native User and role management', 'https://neo4j.com/docs/operations-manual/current/authentication-authorization/native-user-role-management/'),
    understandingDataOnDisk: moreinfo("Understanding Neo4j's Data on Disk",
        'https://neo4j.com/developer/kb/understanding-data-on-disk/'),
    dbStats: moreinfo('db.stats procedures', 'https://neo4j.com/docs/operations-manual/current/reference/procedures/'),
    configuringDataOnDisk: moreinfo('configuration settings reference', 'https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/#config_dbms.directories.data'),
    openFiles: moreinfo('number of open files', 'https://neo4j.com/developer/kb/number-of-open-files/'),
    fsTuning: moreinfo('linux filesystem tuning', 'https://neo4j.com/docs/operations-manual/current/performance/linux-file-system-tuning/'),
    performanceTuning: moreinfo('performance tuning and the page cache', 'https://neo4j.com/developer/guide-performance-tuning/'),
    understandingMemoryConsumption: moreinfo('understanding memory consumption', 'https://neo4j.com/developer/kb/understanding-memory-consumption/'),
    memoryConfiguration: moreinfo('memory configuration and performance', 'https://neo4j.com/docs/operations-manual/3.5/performance/memory-configuration/'),
    tuningGC: moreinfo('memory configuration and performance', 'https://neo4j.com/docs/operations-manual/3.5/performance/memory-configuration/'),
};

export default {
    links,

    StoreFiles: render([
        `Store file sizes allow you to track how much disk space Neo4j is using.
         Neo4j uses a file for each kind of information it manages.  Total disk
         space is also impacted by things such as transaction logs.`,
        links.understandingDataOnDisk,
    ]),
    Neo4jConfiguration: render([
        `The following table displays the contents of the neo4j.conf file, which details
         how the system is configured.`,
        links.configReference,
    ]),
    Roles: render([
        `Roles permit further identifying users and associating them
        with certain permissions.`,
        links.usersAndRoles,
    ]),
    Users: render([
        `User management allows creating new accounts that others can  use
        to access bolt connections in Neo4j.`,
        links.usersAndRoles,
    ]),
    SampleQueries: render([
        `Neo4j includes built-in procedures that let us monitor query execution plan and
        execution times for queries that run on the system.`,
        `Halin allows temporary sampling of this data for inspecting what is running on
        the system at any given time.`,
        `All times are given in microseconds (one millionth of a second)`,
        links.dbStats,
    ]),
    Diagnostics: render([
        `This function runs a suite of tests and can provide advice on how
        to improve your configuration.`,
        `A file will be generated with all
        diagnostics, which you can send to Neo4j to help
        troubleshoot issues.`,
    ]),
    Ping: render([
        `Ping sends a trivial cypher query to the server and measures how 
        long it takes the response to come back.`,
        `This is useful when examining slow queries, because it shows
        how much time network latency and basic cypher queries take, allowing
        us to see how much of query performance is those factors, versus the
        execution of the Cypher itself.`,
    ]),
    StorageCapacity: render([
        'Neo4j allows you to configure different directory locations.',
        'Often these will be on the same disk.',
        `The table below shows the underlying disk free and available 
           in each directory specified in your neo4j.conf file.`,
        `If many statistics are the same, this probably means that most 
        or all of your files reside on the same disk.`,
        links.configuringDataOnDisk,
    ]),
    ClusterMemory: render([
        'The heap space is used for query execution, transaction state, management of the graph etc. The size needed for the heap is very dependent on the nature of the usage of Neo4j. For example, long-running queries, or very complicated queries, are likely to require a larger heap than simpler queries.',
        'Generally speaking, in order to aid performance, we want to configure a large enough heap to sustain concurrent operations.',
        'In case of performance issues we may have to tune our queries, and monitor their memory usage, in order to determine whether the heap needs to be increased.',
        'The heap memory size is determined by the parameters dbms.memory.heap.initial_size and dbms.memory.heap.max_size. It is recommended to set these two parameters to the same value. This will help avoid unwanted full garbage collection pauses.',
        links.memoryConfiguration,
    ]),
    GarbageCollection: render([
        'Slow garbage collection is an indication of performance problems.',
        `For best performance,
           you want to make sure the JVM is not spending too much time 
           performing garbage collection. The goal is to have a large 
           enough heap to make sure that heavy/peak load will not result 
           in so called GC-trashing. Performance can drop as much as two orders 
           of magnitude when GC-trashing happens. Having too large heap may 
           also hurt performance so you may have to try some different 
           heap sizes.`,
        links.tuningGC,
    ]),
    FileDescriptors: render([
        `Operating systems place limits on how many files may be open at once.
        In some cases, the usual limits may be too low.`,
        links.openFiles,
        links.fsTuning,
    ]),
    PageCache: render([
        'The page cache is used to cache the Neo4j data as stored on disk. Ensuring that most of the graph data from disk is cached in memory will help avoid costly disk access.',
        links.performanceTuning,
    ]),
    Memory: render([
        'Total memory shows the total amount in use.',
        'Heap – The heap is where your Class instantiations or “Objects” are stored.',
        `Heap is further divided into two categories; the amount used, and the amount committed,
            or in other words how much the database has allocated for potential use.`,
        `The JVM has memory other than the heap, referred to as Non-Heap Memory. 
            It is created at the JVM startup and stores per-class structures such as 
            runtime constant pool, field and method data, and the code for methods and 
            constructors, as well as interned Strings. The default maximum size of 
            non-heap memory is 64 MB. This can be changed using –XX:MaxPermSize VM option.`,
        links.understandingMemoryConsumption,
    ]),
    SystemLoad: render([
        `The system load is a measure of the amount of computational work that a computer system performs.`,
        `System load represents overall load, while process load shows how much load is caused by
            the Neo4j process itself.`,
        links.performanceTuning,
    ]),
    Tasks: render([
        `Neo4j Tasks is a combination of three kinds of information:  connections,
        transactions, and queries.  This allows monitoring of what is currently 
        executing on a given Neo4j cluster member.`,
        links.txManagement,
        links.connectionManagement,
    ]),
    TransactionsOpen: render([
        'Any query that updates the graph will run in a transaction. An updating query will always either fully succeed, or not succeed at all.',
        links.txManagement,
    ]),
    UsedMemory: render([
        `This displays total physical memory / RAM available to the machine that Neo4j runs on.`,
        `This is not limited to what Neo4j uses, but covers all processes running on that machine`,
        links.jmxMonitoring,
    ]),
    Transactions: render([
        `All database operations that access the graph, indexes, or the schema must be performed in a transaction`,
        `Open transactions are the number of active transactions Neo4j is running at any given moment.`,
        `Rolled back transactions are those who have failed, and whose intermediate effects were "rolled back" so that
            the entire transaction as a package either succeeds or fails.`,
        links.txManagement,
    ]),
};