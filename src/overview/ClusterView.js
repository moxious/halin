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
        const clusterNodes = window.halinContext.clusterNodes.map(clusterNode => ({
            id: clusterNode.id,
            label: clusterNode.getLabel(),
            clusterNode,
        }));

        const overall = {
            id: '0',
            label: 'Neo4j Cluster',
        };
        
        const roles = _.uniq(clusterNodes.map(n => n.clusterNode.role)).map(role => ({ id: `role-${role}`, label: role }));

        const edges = roles.map(roleNode => ({ from: '0', to: roleNode.id }))
            .concat(clusterNodes.map(n => ({ from: `role-${n.clusterNode.role}`, to: n.id })));

        const graph = { 
            nodes: [overall].concat(clusterNodes).concat(roles), 
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