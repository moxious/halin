import HalinQuery from '../HalinQuery';
import fields from '../../fields';
const cdt = fields;

export default new HalinQuery({
    // Only supported with very recent versions of APOC
    dependency: {
        type: 'procedure',
        name: 'apoc.metrics.storage',
    },
    query: 'CALL apoc.metrics.storage(null)',
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
});