import React, { Component } from 'react';
import SortableTree from 'react-sortable-tree';
import 'react-sortable-tree/style.css';
import neo4j from '../driver/';
import _ from 'lodash';

const preWrap = {
    width: '100%',
    whiteSpace: 'pre-wrap',       /* Since CSS 2.1 */
    wordWrap: 'break-word',       /* Internet Explorer 5.5+ */    
};

export default class QueryExecutionPlan extends Component {
    state = {
        treeData: null,
    };

    qepToTreeData(qep, label='') {
        console.log('RECURSE',qep);
        if (_.isNil(qep)) { return null; }

        const mkTitle = () =>
            label ? `${qep.operator} (${label})` : qep.operator;

        const treeNode = {
            title: mkTitle(),
            subtitle: `ID ${neo4j.handleNeo4jInt(qep.id)}`,
            expanded: true,
            children: [],
        };

        if (qep.lhs) {
            treeNode.children.push(this.qepToTreeData(qep.lhs, 'Left Hand Side'));
        }

        if (qep.rhs) {
            treeNode.children.push(this.qepToTreeData(qep.rhs, 'Right Hand Side'));
        }

        // Filter out nulls if there are failed terminal nodes underneath.
        treeNode.children = treeNode.children.filter(c => c);
        return treeNode;
    }

    componentDidMount() {
        this.setState({
            treeData: [this.qepToTreeData(this.props.data.qep)],
        });
    }

    onVisibilityToggle = ({ treeData, node, expanded, path }) => {
        console.log('toggle JMX',node);
    };

    handleTreeOnChange = treeData => {
        console.log('TreeData', treeData);
        this.setState({ treeData });
        // treeData[0].expanded = !treeData[0].expanded;
    };

    render() {
        return this.state.treeData ? (
            <div className='QueryExecutionPlan'>
                <div style={{height: 400}}>
                    <SortableTree
                        canDrag={() => false}
                        canDrop={() => false}
                        treeData={this.state.treeData}
                        onVisibilityToggle={this.onVisibilityToggle}
                        onChange={this.handleTreeOnChange} />
                </div>

                <h3>Query</h3>
                <pre style={preWrap}>{this.props.data.query}</pre>

                <pre style={{ textAlign: 'left' }}>{JSON.stringify(this.props.data.qep, null, 2)}</pre>
            </div>
        ) : '';
    }
}