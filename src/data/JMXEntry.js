import _ from 'lodash';

export default class JMXEntry {
    constructor(name, description, attributes) {
        this.title = name;
        this.subtitle = description;
        this.attributes = attributes;
        this.paramMap = {};
        this.children = Object.keys(attributes).map(attr => this.formatAttr(attr, attributes[attr]));
        this.parseName(name);
    }

    describeParamMap() {
        return Object.keys(this.paramMap).map(key => `${key}: ${this.paramMap[key]}`).join(', ');
    }

    formatAttr(name, singleAttr) {
        const val = _.get(singleAttr, 'value');

        if(_.isArray(val) && !_.get(_.get(val, 0), 'description')) {
            return {
                title: name,
                subtitle: val.join(', '),
                children: [],
                owner: this,
            }
        } else if(_.isArray(val)) {
            return {
                title: name,
                subtitle: 'not yet supported',
                children: [],
            };
        } else if(_.isObject(val)) {
            let kz = Object.keys(val);
            let map = val;

            // When this situation arises it's a funny nested JMX bean, rip out only properties and recurse
            // on those.
            if (kz.length === 2 && kz.indexOf('description') > -1 && kz.indexOf('properties') > -1) {
                kz = Object.keys(val.properties);
                map = val.properties;
            }

            return {
                title: name,
                subtitle: singleAttr.description || this.describeParamMap() || '(undefined)',
                children: kz.map(key => this.formatAttr(key, map[key])),
                owner: this,
            };
        } else {
            return {
                title: name,
                subtitle: _.isObject(singleAttr) ? singleAttr.value : (singleAttr || '(undefined)'),
                children: [],
                owner: this,
            };
        }
    }

    parseName(name) {
        // JMX bean names look like this: org.neo4j:blah=1,foo=2
        const [bean, paramString] = name.split(':');

        const params = paramString.split(',');

        const paramMap = {};
        params.forEach(param => {
            const [key, value] = param.split('=', 2);
            paramMap[key] = value;
        });

        this.bean = bean;
        this.paramMap = paramMap;
        return this;
    };

    static unflatten(tree, entry) {
        const beanParts = entry.bean.split('.');
        let activeNode = tree;

        // Create structure all the way down.
        beanParts.forEach(beanPart => {
            const existingChild = activeNode.children.filter(i => i.title === beanPart)[0];

            if (existingChild) {
                activeNode = existingChild;
            } else {
                const child = { title: beanPart, children: [] };
                activeNode.children.push(child);
                activeNode.component = entry;
                activeNode = child;                
            }
        });

        activeNode.children.push(entry);
        activeNode.children = _.sortBy(activeNode.children, 'title');
        return tree;
    }

    static organize(entries) {
        const tree = {
            title: 'Root',
            children: [],
        };

        entries.forEach(entry => JMXEntry.unflatten(tree, entry));
        return tree;
    }
}