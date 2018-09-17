/**
 * Utilities around dealing with Neo4j Desktop
 */

/**
 * Given a project, return an array of its active graphs.
 */
const getActiveGraphs = proj =>
    proj.graphs.filter(graph => graph.status === 'ACTIVE');

/**
 * Given a context, return an array of active projects.
 * Active projects are any with an active database.
 */
const getActiveProjects = context =>
    context.projects.filter(proj =>
        getActiveGraphs(proj).length > 0);

/**
 * Get the first active set found in the context.
 * Note that in Neo4j Desktop technically more than one thing can be active at a time.
 * So we have to filter through the datastructure to find the first one active, and hope the
 * user isn't doing something funky like running multiple DBs on different ports, which would
 * ... suck.  Because AFAIK Neo4j Desktop doesn't give us a way to say which DB this app
 * is attached to, (would be better)
 * 
 * @param context a Neo4jDesktopApi Context
 * @returns an object with keys project and graph for what's active.
 */
const getFirstActive = () => {
    if (!window.neo4jDesktopApi) {
        throw new Error('Neo4jDesktop API not present');
    }

    const api = window.neo4jDesktopApi;

    return api.getContext()
        .then(context => {
            const activeProjs = getActiveProjects(context);

            if (!activeProjs[0]) {
                console.warn('No active project detected');
                return null;
            }

            const activeProj = activeProjs[0];
            let activeGraph = null;
            
            const graphs = getActiveGraphs(activeProj);
            if (graphs.length > 0) {
                activeGraph = graphs[0];
            }
            
            return { project: activeProj, graph: activeGraph };
        })
        .catch(err => {
            console.error('Failed to inspect context:', err);
        })
};

export default {
    getFirstActive, getActiveGraphs, getActiveProjects,
};