const DEFAULT_PALETTE = [
    '#f68b24', 'steelblue', '#619F3A', '#e14594', '#7045af', '#2b3595', '#dfecd7', 
];

let spinCounter = -1;

const chooseColor = (k = (++spinCounter), palette=DEFAULT_PALETTE) =>
    palette[k % palette.length];

export default {
    chooseColor,
    DEFAULT_PALETTE,
};