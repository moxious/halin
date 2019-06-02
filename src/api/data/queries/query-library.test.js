import ql from './query-library';
import HalinQuery from './HalinQuery';
import HalinContext from '../../HalinContext';
import neo4j from '../../driver/index';
import sinon from 'sinon';
import fakes from '../../../testutils/fakes';

describe('Query Library', function () {
    let ctx;

    beforeEach(() => {
        ctx = new HalinContext();
        neo4j.driver = sinon.fake.returns(fakes.Driver());
        return ctx.initialize();
    });

    afterEach(() => sinon.restore());

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

            if (query.getDependency()) {
                expect(query.getDependency()).toBeInstanceOf(Function);

                it('Query dependencies always return true or false', () => {
                    const val = query.getDependency()(ctx);

                    const passIsBool = (val.pass === true) || (val.pass === false);

                    expect(passIsBool).toBeTruthy();
                    expect(val.description).toBeTruthy();
                });
            }

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