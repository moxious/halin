import advisor from './index';
import testPkg from './test-package.json';
import sentry from '../../sentry/index';

sentry.disable();

describe('Diagnostic Advisor', function () {
    it('exposes generateRecommendations', () => 
        expect(typeof advisor.generateRecommendations).toEqual('function'));

    it('can generate advice from a package', () => {
        const recommendations = advisor.generateRecommendations(testPkg);

        // TODO -- generate a better sample and check that the recommendations are valid.
    });
});