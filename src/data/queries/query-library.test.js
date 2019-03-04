import ql from './query-library';
import HalinQuery from './HalinQuery';

describe('Query Library', function () {
    it('is an object', () => expect(ql).toBeInstanceOf(Object));

    Object.keys(ql).forEach(key => {
        describe(key, function () {
            const query = ql[key];

            it('is a HalinQuery', () => expect(query).toBeInstanceOf(HalinQuery));
            it('has a description', () => expect(query.getDescription()).toBeTruthy());
            it('provides example results', () => expect(query.getExample().length).toBeGreaterThan(0));
            it('has valid columns', () => {
                expect(query.getColumns().length).toBeGreaterThan(0);
                query.getColumns().map(c => expect(c.accessor, 'Has Accessor').toBeTruthy());
                query.getColumns().map(c => expect(c.Header, 'Has Header').toBeTruthy());

            });
            it('has a positive rate', () => expect(query.getRate()).toBeGreaterThan(0));

            it('has an example result which covers its columns', () => {
                const example = query.getExample()[0];

                query.getColumns().map(c => c.accessor).forEach(col => {
                    expect(col in example, `Accessor ${col}`).toBeTruthy();
                });
            });

            const params = query.getParameters();
            const paramNames = Object.keys(params);

            // If the query declares parameters, they should be referenced in the query itself.
            paramNames.forEach(param => {
                const ref = `$${param}`;

                expect(query.getQuery().indexOf(ref), `Query contains reference to param ${param} as ${ref}`).toBeGreaterThan(-1);
            });
        })
    });
});