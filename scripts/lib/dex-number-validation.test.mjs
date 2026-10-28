import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidRegionalDexNumber } from './dex-number-validation.mjs';

test('accepts Victini-style regional dex number 0', () => {
  assert.equal(isValidRegionalDexNumber(0), true);
});

test('accepts positive regional dex numbers', () => {
  assert.equal(isValidRegionalDexNumber(1), true);
  assert.equal(isValidRegionalDexNumber(400), true);
});

test('rejects negative and non-integer regional dex numbers', () => {
  assert.equal(isValidRegionalDexNumber(-1), false);
  assert.equal(isValidRegionalDexNumber(1.5), false);
});
