import datautil from '../data/util';
import _ from 'lodash';
import React from 'react';

const convertMsToTime = (millis) => {
    if (_.isNil(millis)) { return 'n/a'; }

    let delim = " ";
    let hours = Math.floor(millis / (1000 * 60 * 60) % 60);
    let minutes = Math.floor(millis / (1000 * 60) % 60);
    let seconds = Math.floor(millis / 1000 % 60);
    const hoursStr = hours < 10 ? '0' + hours : hours;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const secondsStr = seconds < 10 ? '0' + seconds : seconds;

    let str = secondsStr + 's';
    if (minutes > 0) { str = minutesStr + delim + str; }
    if (hours > 0) { str = hoursStr + delim + str; }

    return str;
};

const toInt = val => {
    if (_.isNil(val)) { return 'n/a'; }
    const num = parseInt(val, 10);
    return num.toLocaleString();
};

const toFloat = val => {
    if (_.isNil(val)) { return 'n/a'; }
    const num = parseFloat(val, 10);
    return num;
};

const jsonField = (item) => {
    return <div className='_jsonField'>{JSON.stringify(item.value)}</div>;
};

const numField = (item) => {
    return <div className='_numberField'>{toInt(item.value)}</div>;
};

const dataSizeField = (item) => {
    return <div className='_dataSizeField'>{datautil.humanDataSize(item.value, true)}</div>
};

const pctField = (item) => {
    if (_.isNil(item.value)) {
        return 'n/a %';
    }

    const num = toFloat(item.value);
    const pct = num * 100;
    const chopped = Math.round(pct * 100)/100;  // 2 decimal places
    return <div className='_pctField'>{chopped} %</div>;
};

const timeField = (item) => {
    return <div className='_timeField'>{convertMsToTime(item.value)}</div>;
};

const mappedValueField = (mapping) => (item) => {
    return mapping[item.value] || item.value;
};

export default {
    jsonField, numField, dataSizeField, pctField, timeField, mappedValueField,
};