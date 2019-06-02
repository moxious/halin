const DEFAULT_PALETTE = [
    '#f68b24', 'steelblue', '#619F3A', '#e14594', '#7045af', '#2b3595', '#dfecd7', 
];

// https://www.colourlovers.com/palette/612903/Two_KneeOns
const TWO_TONE = [
    '#35CF21', // Limed
    '#6814DF', // Gorilla Grape
];

let spinCounter = -1;

const chooseColor = (k = (++spinCounter), palette=DEFAULT_PALETTE) =>
    palette[k % palette.length];

export default {
    chooseColor,
    DEFAULT_PALETTE,
    TWO_TONE,
};