import _ from 'lodash';
import sentry from '../sentry/index';

export default class TreeItem {
    constructor(title, subtitle, value) {
        this.title = title;
        this.subtitle = subtitle;
        this.value = value;
    }

    static unflatten(tree, entry) {
        try {
            const parts = entry.title.split('.');
            let activeNode = tree;

            parts.forEach(part => {
                const existingChild = activeNode.children.filter(i => i.title === part)[0];

                if (existingChild) {
                    activeNode = existingChild;
                } else {
                    const child = { title: part, children: [] };
                    activeNode.children.push(child);
                    activeNode = child;
                }
            });

            const relabeled = {
                title: `${entry.title}=${entry.value}`,
                description: entry.description,
                children: [],
            };
            activeNode.children.push(relabeled)
            activeNode.children = _.sortBy(activeNode.children, 'title');
            return tree;
        } catch (e) {
            sentry.error('Failed to unflatten', entry, e);
            throw e;
        }
    }

    static toTree(treeItems) {
        const tree = {
            title: 'Root',
            children: [],
        };

        treeItems.forEach(item => TreeItem.unflatten(tree, item));
        return tree;
    }
}