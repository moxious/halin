import React from 'react';
import { Form } from 'semantic-ui-react';
import neo4j from '../../../api/driver';

const buildOptions = () =>
    window.halinContext.databases().map((db, i) => ({
        key: db.getLabel(),
        value: db.getLabel(),
        text: db.getLabel(),
        disabled: db.getLabel() === neo4j.SYSTEM_DB,
    }));

export default (props) =>
    <Form.Select {...props}
        placeholder='Select Database'
        options={buildOptions(props)} />;       
