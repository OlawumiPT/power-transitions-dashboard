const {
  isNullOrEmpty,
  validateNumber,
  validateEnum,
  validateYear,
  NUMERIC_FIELDS,
  ENUM_FIELDS,
  SCORE_FIELDS,
} = require('../middleware/projectValidation');

describe('isNullOrEmpty', () => {
  test('returns true for null, undefined, empty string', () => {
    expect(isNullOrEmpty(null)).toBe(true);
    expect(isNullOrEmpty(undefined)).toBe(true);
    expect(isNullOrEmpty('')).toBe(true);
  });

  test('returns false for actual values', () => {
    expect(isNullOrEmpty('hello')).toBe(false);
    expect(isNullOrEmpty(0)).toBe(false);
    expect(isNullOrEmpty(false)).toBe(false);
  });
});

describe('validateNumber', () => {
  test('accepts null/empty as valid (optional field)', () => {
    expect(validateNumber(null, 0, 100).valid).toBe(true);
    expect(validateNumber('', 0, 100).valid).toBe(true);
    expect(validateNumber(undefined, 0, 100).valid).toBe(true);
  });

  test('validates numbers within range', () => {
    expect(validateNumber(50, 0, 100).valid).toBe(true);
    expect(validateNumber(0, 0, 100).valid).toBe(true);
    expect(validateNumber(100, 0, 100).valid).toBe(true);
  });

  test('rejects numbers outside range', () => {
    expect(validateNumber(-1, 0, 100).valid).toBe(false);
    expect(validateNumber(101, 0, 100).valid).toBe(false);
  });

  test('rejects non-numeric values', () => {
    expect(validateNumber('abc', 0, 100).valid).toBe(false);
  });

  test('accepts string numbers', () => {
    expect(validateNumber('50', 0, 100).valid).toBe(true);
  });
});

describe('validateEnum', () => {
  const allowed = ['Operating', 'Retired', 'Future'];

  test('accepts null/empty as valid (optional field)', () => {
    expect(validateEnum(null, allowed).valid).toBe(true);
    expect(validateEnum('', allowed).valid).toBe(true);
  });

  test('validates allowed values case-insensitively', () => {
    expect(validateEnum('Operating', allowed).valid).toBe(true);
    expect(validateEnum('operating', allowed).valid).toBe(true);
    expect(validateEnum('RETIRED', allowed).valid).toBe(true);
  });

  test('rejects disallowed values', () => {
    expect(validateEnum('Invalid', allowed).valid).toBe(false);
  });
});

describe('validateYear', () => {
  test('accepts null/empty as valid', () => {
    expect(validateYear(null).valid).toBe(true);
    expect(validateYear('').valid).toBe(true);
  });

  test('accepts valid years', () => {
    expect(validateYear(2000).valid).toBe(true);
    expect(validateYear(1950).valid).toBe(true);
    expect(validateYear('2025').valid).toBe(true);
  });

  test('rejects invalid years', () => {
    expect(validateYear(1800).valid).toBe(false);
    expect(validateYear(2300).valid).toBe(false);
    expect(validateYear('abc').valid).toBe(false);
  });
});

describe('validation config', () => {
  test('NUMERIC_FIELDS has expected entries', () => {
    const fields = NUMERIC_FIELDS.map(f => f.field);
    expect(fields).toContain('legacy_nameplate_capacity_mw');
    expect(fields).toContain('poi_voltage_kv');
    expect(fields).toContain('capacity_factor_2024');
  });

  test('ENUM_FIELDS has expected entries', () => {
    expect(ENUM_FIELDS).toHaveProperty('status');
    expect(ENUM_FIELDS).toHaveProperty('process_type');
    expect(ENUM_FIELDS.status).toContain('Operating');
  });

  test('SCORE_FIELDS has expected ranges', () => {
    const transactability = SCORE_FIELDS.find(f => f.field === 'transactability_scores');
    expect(transactability).toBeDefined();
    expect(transactability.min).toBe(1);
    expect(transactability.max).toBe(3);
  });
});
