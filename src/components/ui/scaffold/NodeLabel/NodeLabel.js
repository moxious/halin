import React, { Component } from 'react';
import { Image, Popup } from 'semantic-ui-react';

/**
 * A simple UI label that can be attached to other elements, to indicate which Neo4j node
 * some data came from.
 */
export default class NodeLabel extends Component {
    render() {
        return (
            <Popup trigger={
                <div className="ui image label" style={{hover:'none'}}>
                    <Image src="img/neo4j_logo_globe.png" size="mini"/>
                    {this.props.node ? this.props.node.getLabel() + ' ' + this.props.node.role : 'NONE' }
                </div>
            } content={
                this.props.node ? this.props.node.getLabel() : 'N/A'
            }/>
        )
    }
}