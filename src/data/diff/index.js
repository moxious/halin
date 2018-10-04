/**
 * Utilies for computing differences
 */


/**
 * Takes a setOfSets, which is an object that maps a label for the set to an array of objects which comprise the set.
 * For example, the keys could be node addresses and the set could be configuration items the node has.
 * @returns a diff set.
 */
const configurationDiff = (setOfSets, nameAccessor='key') => {
    const labels = Object.keys(setOfSets);

    // Every item that exists anywhere.
    let unionAll = new Set([]);

    // Only those items that exist in any set.
    let intersectAll = null;

    // Map that merges values.  Keys are keys from underlying set of sets.
    // Values are arrays of { label, value } corresponding to the different values
    // that exist across the set of sets.
    const values = {};
    
    labels.forEach(label => {
        const thisValueSet = setOfSets[label];
        const namesHere = new Set(Object.keys(thisValueSet));
        [...namesHere].forEach(name => {
            const stringifiedValue = `${thisValueSet[name]}`;

            values[name] = values[name] || {};

            if (values[name].hasOwnProperty(stringifiedValue)) {
                values[name][stringifiedValue].push(label);
            } else {
                values[name][stringifiedValue] = [label];
            }
        });

        // Initialize if needed.
        unionAll = unionAll || new Set([]);
        intersectAll = intersectAll || new Set([...namesHere]);

        // Add the current set of names to the union.
        unionAll = new Set([...unionAll, ...namesHere]);

        // Narrow the intersection to only those that are already in the intersection,
        // and in this set too, progressive intersection.
        intersectAll = new Set([...intersectAll].filter(x => namesHere.has(x)));
    });

    // Those items that exist in this set and nowhere else.
    let unique = {};
    labels.forEach(label => {
        const thisValueSet = setOfSets[label];
        const namesHere = new Set(Object.keys(thisValueSet));

        // the "unique here" set is any entry this item has that isn't in the group intersection.
        // **note** -- if you have 4 labels, and 2 of them share a property, this is considered to be
        // "unique" even though it isn't, to prevent the need to break out into too many different 
        // combinatorial subsets.  E.g. in 3 nodes, we don't report: 'items in only 1, items in 2 but not all 3.'.
        // We report 'items in all' and 'items unique to some'.
        unique[label] = [...new Set([...namesHere].filter(x => !intersectAll.has(x)))];
    });

    const allLabels = Object.keys(setOfSets).sort();

    // Suppose the setofSets labels are a, b, c.
    // Make a table summarizing all of the differences.
    // There will be as many rows as there are keys in the union of all observed values
    // (for example, neo4j configuration items)
    // Within each row, you'll have a column for each node (a, b, c) showing the value of
    // that setting.  In this way, we can summarize n configurations in a single table,
    // and by filtering allow the user to quickly pick out the differences.
    const table = [...unionAll].sort().map(name => {
        const valueMap = values[name];
        const possibleValues = Object.keys(valueMap);
        const row = { 
            name, 

            // A row is "unanimous" if all entries have exactly the same value.
            // If that's the case, there will only be one possible value.
            unanimous: possibleValues.length === 1,
        };

        allLabels.forEach(label => {
            // Find the value that this label has in the valueMap.
            possibleValues.forEach(possibleValue => {
                if (valueMap[possibleValue].indexOf(label) > -1) {
                    // This label had this value for this name.
                    row[label] = possibleValue;
                }
            });

            if (!row[label]) {
                row[label] = '<Value not specified>';
            }
        });

        return row;
    });

    return {
        table,
        intersectAll: [...intersectAll],
        unionAll: [...unionAll],
        unique,
        values,
    };
};

/*
const sos = {
    a: {
        x: 1,
        y: 2,
        z: null,
    },
    b: {
        x: 1,
        y: 2,
    },
    c: {
        x: 2,
        y: 2,
    },
};

// Sample use:
// console.log(sos);
// console.log(JSON.stringify(configurationDiff(sos), null, 2));
*/

export default {
    configurationDiff,
};