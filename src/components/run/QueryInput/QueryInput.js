import React, { Component } from 'react';
import 'babel-polyfill';
import classNames from 'classnames';
import uuid from 'uuid';
import sentry from '../../../api/sentry';
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/hint/show-hint'
import 'codemirror/addon/edit/closebrackets'
import { createCypherEditor } from 'cypher-codemirror';
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/lint/lint.css'
import 'cypher-codemirror/dist/cypher-codemirror-syntax.css'
import './QueryInput.css';

class QueryInput extends Component {
    state = {
        key: uuid.v4(),
        query: '',
        pending: false,
        theme: 'cypher cypher-dark',
        isFocused: false,
    };

    handleChange(field, event) {
        const mod = {};
        mod[field] = event.target.value;
        this.setState(mod);
    }

    submit(event) {
        sentry.fine('Run query', this.state);
        event.preventDefault();
    }

    codemirrorValueChange = (doc, change) => {
        if (this.props.onChange) {
            return this.props.onChange(doc, change);
        }
    };

    focusChanged(focused) {
        this.setState({
            isFocused: focused
        })
        this.props.onFocusChange && this.props.onFocusChange(focused)
    }

    scrollChanged(cm) {
        this.props.onScroll && this.props.onScroll(cm.getScrollInfo())
    }

    getCodeMirror() {
        return this.codeMirror;
    }

    componentDidMount() {
        const { editor, editorSupport } = createCypherEditor(
            this.editorReference,
            {}
        );

        this.codeMirror = editor
        this.codeMirror.on('change', this.codemirrorValueChange) // Triggered before DOM update
        this.codeMirror.on('changes', this.codemirrorValueChange) // Triggered after DOM update
        this.codeMirror.on('focus', this.focusChanged.bind(this, true))
        this.codeMirror.on('blur', this.focusChanged.bind(this, false))
        this.codeMirror.on('scroll', this.scrollChanged.bind(this))
        this.codeMirror.setValue(this.props.defaultValue || this.props.value || '')
        this.editorSupport = editorSupport;
        console.log(this.editorSupport);
        //   this.editorSupport.setSchema(this.props.schema)
    }

    render() {
        const setEditorReference = ref => {
            this.editorReference = ref
        };

        const editorClassNames = classNames(
            'QueryInput',
            'ReactCodeMirror',
            { 'ReactCodeMirror--focused': this.state.isFocused },
            this.props.classNames
        );

        return (
            <div className={editorClassNames} ref={setEditorReference} />
        );
    }
}

export default QueryInput;