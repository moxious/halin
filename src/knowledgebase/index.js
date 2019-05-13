import React from 'react';
import _ from 'lodash';

let k = 0;

const render = lines => 
    <div className='KnowledgeBase'>
        { lines.map(l => _.isString(l) ? <p key={`kb${k++}`}>{l}</p> : l ) }
    </div>;

const moreinfo = (title, link) =>
    <p key={`kb${k++}`}>For more information, see <a href={link}>{title}</a></p>;

export default {
    StoreFiles: render([
        `Store file sizes allow you to track how much disk space Neo4j is using.
         Neo4j uses a file for each kind of information it manages.  Total disk
         space is also impacted by things such as transaction logs.`,
        moreinfo("Understanding Neo4j's Data on Disk", 
            'https://neo4j.com/developer/kb/understanding-data-on-disk/')
    ]),
};