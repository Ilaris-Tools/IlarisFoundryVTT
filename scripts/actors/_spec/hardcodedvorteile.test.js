import * as hardcoded from './../hardcodedvorteile.js';
// const hardcoded = require('./../hardcodedvorteile');

test('adds 1 + 2 to equal 3', () => {
    expect(hardcoded.sum(1, 2)).toBe(3);
  });

  test('adds 1 + 2 to equal 4 - will fail', () => {
    expect(hardcoded.sum(2, 2)).toBe(3);
  });