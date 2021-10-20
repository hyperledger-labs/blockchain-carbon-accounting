import { assert } from 'chai';
import { getYearFromDate } from '../../src/lib/emissions-calc';

describe('lib/emissions-calc', () => {
    describe('getYearFromDate', () => {
        it('successfully got the year', () => {
            let input = '2001-08-02';
            assert.equal(2001, getYearFromDate(input));
            input = '02-08-2001';
            assert.equal(2001, getYearFromDate(input));
        });
        it('invalid data format', () => {
            const input = '02-2008-09';
            let err: Error;
            try {
                getYearFromDate(input);
            } catch (error) {
                err = error as Error;
            }
            assert.exists(err);
        });
    });
});
