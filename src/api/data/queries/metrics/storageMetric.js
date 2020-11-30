import HalinQuery from '../HalinQuery';
import fields from '../../fields';
import neo4j from '../../../driver/index';
const cdt = fields;

export default new HalinQuery({
    description: 'Fetches storage metrics from APOC, if supported',
    // Only supported with very recent versions of APOC
    dependency: ctx => ({
        pass: ctx.supportsMetrics(),
        description: 'Requires CSV Metrics Support (present in recent APOC releases)',
    }),
    query: `
        WITH 'generic' AS variant
        CALL apoc.metrics.storage(null)
        YIELD setting, freeSpaceBytes, totalSpaceBytes, usableSpaceBytes, percentFree
        RETURN setting, freeSpaceBytes, totalSpaceBytes, usableSpaceBytes, percentFree
    `,
    columns: [
        { 
            Header: 'Location', 
            accessor: 'setting',
            Cell: cdt.mappedValueField({
                'dbms.directories.certificates': 'SSL Certificates',
                'dbms.directories.data': 'Data Files',
                'dbms.directories.import': 'Import Data',
                'dbms.directories.lib': 'Libraries',
                'dbms.directories.logs': 'Log Files',
                'dbms.directories.metrics': 'Metrics',
                'dbms.directories.plugins': 'Plugins',
                'dbms.directories.run': 'Binaries',
                'dbms.directories.tx_log': 'Transaction Logs',
                'unsupported.dbms.directories.neo4j_home': 'Neo4j Home',
            }, item => item.value),
        },
        { Header: 'Free', accessor: 'freeSpaceBytes', Cell: cdt.dataSizeField },
        { Header: 'Total', accessor: 'totalSpaceBytes', Cell: cdt.dataSizeField },
        { Header: 'Usable', accessor: 'usableSpaceBytes', Cell: cdt.dataSizeField },
        { Header: '% Free', accessor: 'percentFree', Cell: cdt.pctField },
    ],
    exampleResult: [
        {
            setting: "dbms.directories.certificates",
            freeSpaceBytes: neo4j.int(167096918016),
            totalSpaceBytes: neo4j.int(499963170816),
            usableSpaceBytes: neo4j.int(162099400704),
            percentFree: 0.3342184540178784,
        },
    ],
});