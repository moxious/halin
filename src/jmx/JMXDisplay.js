import React, { Component } from "react";
import "semantic-ui-css/semantic.min.css";
import jmx from '../data/jmx';
// This only needs to be done once; probably during your application's bootstrapping process.
import 'react-sortable-tree/style.css';

// You can import the default tree with dnd context
import SortableTree from 'react-sortable-tree';

class JMXDisplay extends Component {
    constructor(props, context) {
        super(props, context);

        const data = props.data;
        const tree = jmx.jmx(data);

        // console.log('JMX',props);
        this.state = {
            treeData: tree.children
        };
    }

    onChange (treeData) {
        this.setState({ treeData });
    }

    onVisibilityToggle ({ treeData, node, expanded, path }) {
        console.log('toggle JMX',node);
    }

    render() {
        return (
            <div style={{ align: 'center', height: 800 }}>
                <h2>Raw JMX Data</h2>

                <p>This is just a POC.  Some of this is messy and not labeled right, but all of the data is
                    there.  Will reorganize later.</p>

                <SortableTree
                    treeData={this.state.treeData}
                    onChange={treeData => this.onChange(treeData)}
                    onVisibilityToggle={treeData => this.onVisibilityToggle(treeData)}
                />
            </div>
        );
    }
}

export default JMXDisplay;