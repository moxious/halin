import JMXEntry from './JMXEntry';

const jmx = input => {
    const entries = input.records.map(rec => new JMXEntry(
        rec.get('name'),
        rec.get('description'),
        rec.get('attributes')
    ));

    return JMXEntry.organize(entries);
};

export default {
    jmx,
};