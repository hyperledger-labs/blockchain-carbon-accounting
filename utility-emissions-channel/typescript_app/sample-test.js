const expect = require("chai").expect;
describe('add', function() {
  it('should return the sum of two positive numbers', function() {
    expect(add( 2, 4 )).to.equal(6);
  });
});
