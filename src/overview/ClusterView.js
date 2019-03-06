import React, { Component } from 'react';
import hoc from '../higherOrderComponents';
import Graph from 'react-graph-vis';
import _ from 'lodash';

class ClusterView extends Component {
    state = {
        graph: null,

        options: {
            layout: {
                hierarchical: false,
            },
            edges: {
                color: "#000000"
            }
        },
    };

    componentDidMount() {
        const clusterMembers = window.halinContext.members().map(clusterMember => ({
            id: clusterMember.id,
            label: clusterMember.getLabel(),
            clusterMember,
        }));

        const overall = {
            id: '0',
            label: 'Neo4j Cluster',
        };
        
        const roles = _.uniq(clusterMembers.map(n => n.clusterMember.role)).map(role => ({ id: `role-${role}`, label: role }));

        const edges = roles.map(roleNode => ({ from: '0', to: roleNode.id }))
            .concat(clusterMembers.map(n => ({ from: `role-${n.clusterMember.role}`, to: n.id })));

        const graph = { 
            nodes: [overall].concat(clusterMembers).concat(roles), 
            edges,
        };
        this.setState({ graph });
    }

    render() {
        const events = {
            select: function(event) {
                var { nodes, edges } = event;
            }
        };

        const style = {
            maxWidth: '50%',
            height: '500px',
        };

        return (
            <div className='ClusterView'>
                { this.state.graph ? 
                <Graph 
                    graph={this.state.graph} 
                    options={this.state.options} 
                    events={events}
                    style={style}
                /> : 
                '' 
                }
            </div>
        )
    }
}

export default hoc.clusterOnlyComponent(ClusterView);