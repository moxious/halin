import fields from './fields';

describe('Fields', function () {  
    describe('JSON Field', () => {
        const json = { x: 1, y: { a: 'b' } };
        const jsonStr = JSON.stringify(json);

        it('should produce a JSON text result in a div', () => {
            const val = fields.jsonField({ value: json });
            console.log(val.props);
            expect(val.props.className).toEqual('_jsonField');
            expect(val.props.children).toEqual(jsonStr);
        });
    });

    describe('Num Field', () => {
        it('Should convert value to integer', () => {
            const r = fields.numField({ value: "25" });
            expect(r.props.className).toEqual('_numberField');
            expect(r.props.children).toEqual('25');
        });

        it('Should list as n/a a null value', () => {
            const r = fields.numField({ value: null });
            expect(r.props.children).toEqual('n/a');
        });
    });

    describe('Data Size Field', () => {
        it('should reformat long byte values', () => {
            const r = fields.dataSizeField({ value: 1073741824 });
            expect(r.props.className).toEqual('_dataSizeField');
            expect(r.props.children).toEqual('1.1 GB');
        });
    });

    describe('Percentage field', () => {
        it('should make floating point numbers into percentages', () => {
            const r = fields.pctField({ value: 0.5 });
            expect(r.props.className).toEqual('_pctField');
            expect(r.props.children).toEqual([50, " %"]);
        });

        it('should round to two decimal places', () => {
            const r = fields.pctField({ value: 0.3333333333 });
            expect(r.props.children).toEqual([33.33, " %"]);
        });
    });

    describe('Time Field', () => {
        it('should convert ms to time', () => {
            const r = fields.timeField({ value: 110310441 });
            expect(r.props.children).toEqual('30 38 30s');
        });
    });

    describe('Mapped Data Field', () => {
        it('should return a mapping', () => {
            const mapping = {
                x: 1, 
                y: 2,
            };

            const f = fields.mappedValueField(mapping);
            const r = f({ value: 'x' });
            expect(r).toEqual(1);
        });
    });
});