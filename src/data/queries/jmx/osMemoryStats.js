import HalinQuery from '../HalinQuery';

export default new HalinQuery({
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
    rate: 1000,
})