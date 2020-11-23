import HalinQuery from '../HalinQuery';
import column from '../column';

export default new HalinQuery({
    description: 'Inspects number of open file descriptors at the OS level',
    query: `
    WITH 'generic' AS variant
    CALL dbms.queryJmx("java.lang:type=OperatingSystem") 
    YIELD attributes 
    WITH
        attributes.OpenFileDescriptorCount.value as fdOpen,
        attributes.MaxFileDescriptorCount.value as fdMax
    RETURN 
        fdOpen, fdMax
    `,
    columns: ['fdOpen', 'fdMax'].map(column),
    rate: 2000,
    exampleResult: [
        {
            fdOpen: 622,
            fdMax: 10240,
        },
    ],
});
