import sinon from 'sinon';
import Metric from './Metric';

describe('Metric', function() {
    let m;
    let canaryFunction;

    beforeEach(() => {
        m = new Metric();
        canaryFunction = sinon.fake();
    });

    it('requires overriding currentState', () => {
        expect(() => m.currentState()).toThrow(Error);
    });

    it('required overriding isFresh', () => {
        expect(() => m.isFresh()).toThrow(Error);
    });

    it('can register a listener', () => {
        const result = m.on('data', canaryFunction);
        expect(m._subscribers['data'].indexOf(canaryFunction) > -1);
        expect(result).toBe(canaryFunction);
    });

    it('does not register duplicate functions, which would cause duplicate callbacks', () => {
        m.on('data', canaryFunction);
        m.on('data', canaryFunction);
        m.on('data', canaryFunction);

        expect(m._subscribers['data'].length).toBe(1);
    });

    it('can de-register a listener', () => {
        m.on('data', canaryFunction);

        const result = m.removeListener('data', canaryFunction);
        expect(result).toBe(canaryFunction);
        expect(m._subscribers['data'].indexOf(canaryFunction) === -1);
    });

    it('will call listeners', () => {
        m.on('data', canaryFunction);
        
        m._notifyListeners('data', 'nonsense');
        expect(canaryFunction.callCount).toBe(1);
    });

    it('survives errors inside of listener functions', () => {
        const alwaysFails = () => {
            throw new Error('I am a disaster');
        };

        m.on('data', alwaysFails);
        
        expect(() => m._notifyListeners('data', 'whatever')).not.toThrow(Error);
    });
});