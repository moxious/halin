import HalinQuery from '../HalinQuery';
import fields from '../../fields';
const cdt = fields;

export default new HalinQuery({
    query: `
        CALL db.stats.retrieve("QUERIES") 
        YIELD data 
        WITH 
            data.queryExecutionPlan as qep,                
            data.estimatedRows as estimatedRows,
            data.invocationSummary.invocationCount as invocationCount,
            data.invocationSummary.compileTimeInUs as compileTime,
            data.invocationSummary.executionTimeInUs as executionTime,
            data.query as query,
            data.invocations as invocations

        RETURN 
            query,
            qep, 
            invocationCount,
            compileTime.min as compileMin,
            compileTime.max as compileMax,
            compileTime.avg as compileAvg,
            executionTime.min as executeMin,
            executionTime.max as executeMax,
            executionTime.avg as executeAvg,
            estimatedRows,
            invocations
        ORDER BY query ASC
    `,
    columns: [
        { Header: 'Query', accessor: 'query', style: { whiteSpace: 'unset', textAlign: 'left' } },
        { Header: 'Plan', accessor: 'qep', show: false },
        { Header: 'Count', width: 120, accessor: 'invocationCount', Cell: cdt.numField },
        { Header: 'Compile(min)', width: 120, accessor: 'compileMin', show: false, Cell: cdt.numField  },
        { Header: 'Compile(max)', width: 120, accessor: 'compileMax', show: false, Cell: cdt.numField  },
        { Header: 'Compile(avg)', width: 120, accessor: 'compileAvg', Cell: cdt.numField  },
        { Header: 'Execute(min)', width: 120, accessor: 'executeMin', show: false, Cell: cdt.numField  },
        { Header: 'Execute(max)', width: 120, accessor: 'executeMax', show: false, Cell: cdt.numField  },
        { Header: 'Execute(avg)', width: 120, accessor: 'executeAvg', Cell: cdt.numField  },
        { Header: 'Estimated Rows', width: 120, accessor: 'estimatedRows', Cell: cdt.numField },
        { Header: 'Timings', accessor: 'invocations', show: false },
    ],
});