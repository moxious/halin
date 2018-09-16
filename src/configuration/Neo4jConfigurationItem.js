import TreeItem from '../data/TreeItem';

export default class Neo4jConfigurationItem extends TreeItem {
    constructor(name, description, value) {
        super(name, description, value);
        this.name = name;
        this.description = description;
        this.value = value;
        this.editable = false;
    }

    setEditable(editable) {
        this.editable = editable;
    }
}