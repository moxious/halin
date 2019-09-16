import React from 'react';
import PropTypes from 'prop-types';
import neo4j from '../../../api/driver';
import './Neo4jResultValue.css';
import _ from 'lodash';
import sentry from '../../../api/sentry';

let spinner=0;

/**
 * Make a Neo4jValue component clickable
 * @param {Function} clickFn Function to call on click
 * @param {Object} thingClicked what got clicked
 * @param {Object} context context where it exists
 * @param {Component} innerValue what goes inside the link
 */
const clickable = (clickFn, thingClicked, context, innerValue) => 
    <button id={'c_'+(spinner++)} className='ButtonLink' variant="link" onClick={e => clickFn(e, thingClicked, context)}>{innerValue}</button>;

const renderDriverObject = (obj, onClick) => {
    if (_.isNil(obj)) { return 'null'; }
    const resultObj = {};

    Object.keys(obj).forEach(key => {
        const val = obj[key];
        resultObj[key] = renderIndividual(val, onClick);
    });

    return resultObj;
};

const labels = labels => 
    <span className="Neo4jLabels">:{ labels.length > 0 ? labels.join(',') : '(Unlabeled)' }</span>;

const relType = t =>
    <span className="Neo4jRelType">:{t}</span>;

const k = k => <span className='_k'>{k}</span>;
const v = v => <span className='_v'>{v}</span>;

const neo4jProperties = (owner, onClick) => {
    const props = renderDriverObject(owner.properties, onClick);
    
    return (
        <span className="Neo4jProperties">&#123;
            {Object.keys(props).sort().map((key, i) => {
                const isLast = i === Object.keys(props).length - 1;
                return clickable(onClick, { property: key }, owner, 
                    <span key={i} className='_prop'>
                        {k(key)}: {v(props[key])}{isLast ? '' : <span>,&nbsp;</span> }
                    </span>);
            })}
        &#125;</span>
    );
};

const node = (n, onClick) => 
    <span className='Neo4jValue Neo4jNode'>({labels(n.labels)} {neo4jProperties(n, onClick)})</span>;

const rel = (r, onClick) => {
    const start = neo4j.handleNeo4jInt(r.start);
    const end = neo4j.handleNeo4jInt(r.end);

    return (
        <span className='Neo4jValue Neo4jRelationship'>
            [{relType(r.type)} {neo4jProperties(r, onClick)} start: {start} end: {end}]
        </span>
    );
};

const path = (p, onClick) =>
    <span className="Neo4jValue Neo4jPath">
        &lt;Path length: {p.length}&gt;
    </span>;

const rawValue = t =>
    <span className="Neo4jValue Neo4jRawValue">{JSON.stringify(t)}</span>;

const date = d => <span className='Neo4jValue Neo4jDate'>{d.toString()}</span>;
const dateTime = dt => <span className='Neo4jValue Neo4jDateTime'>{dt.toString()}</span>;
const point = p => {
    const srid = neo4j.handleNeo4jInt(p.srid);
    const x = p.x;
    const y = p.y;
    const z = p.z || null;

    console.log('POINT', p, srid, x, y, z);

    return (
        <span className='Neo4jValue Neo4jPoint'>
            &lt;point srid: {srid} x: {x}, y: {y}{ z ? <span>, z: {z}</span> : '' })&gt;
        </span>
    );
};
const duration = d => `DURATION ${d}`;
const localDateTime = ldt => <span className='Neo4jValue Neo4jLocalDateTime'>{ldt.toString()}</span>;
const localTime = lt => <span className='Neo4jValue Neo4jLocalTime'>{lt.toString()}</span>;
const time = t => <span className='Neo4jValue Neo4jTime'>{t.toString()}</span>;

const renderIndividual = (thing, onClick) => {
    if (_.isNil(thing)) { return 'null' }
    if (neo4j.isNeo4jInt(thing)) {
        return rawValue(neo4j.handleNeo4jInt(thing), onClick);
    }

    const transformers = {
        'Node': node,
        'Relationship': rel,
        'Path': path,
        'Point': point,
        'Date': date,
        'DateTime': dateTime,
        'Duration': duration,
        'LocalDateTime': localDateTime,
        'LocalTime': localTime,
        'Time': time,
    };

    if (thing.constructor && transformers[thing.constructor.name]) {
        return transformers[thing.constructor.name](thing, onClick);
    }

    return rawValue(thing, onClick);
};

const Neo4jResultValue = (props = {}) => {
    const handleClick = (e, val, context) => {
        e.preventDefault();
        sentry.fine('Value clicked', val, 'Context', context);
        if (props.onClick) {
            return props.onClick(e, val, context);
        }
    };

    return renderIndividual(props.val, handleClick);
};

Neo4jResultValue.defaultProps = { val: null };

Neo4jResultValue.props = {
    val: PropTypes.any,
    onClick: PropTypes.func,
};

export default Neo4jResultValue;
