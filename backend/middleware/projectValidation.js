/**
 * Project Validation Middleware
 * Validates project data for create and update operations
 */

const isNullOrEmpty = (v) => v === null || v === undefined || v === '';

/**
 * Validate a numeric value within a range
 * @param {*} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {{ valid: boolean, message?: string }}
 */
const validateNumber = (value, min, max) => {
  if (isNullOrEmpty(value)) {
    return { valid: true }; // All numeric fields are optional
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, message: 'Must be a valid number' };
  }
  if (num < min || num > max) {
    return { valid: false, message: `Must be between ${min} and ${max}` };
  }
  return { valid: true };
};

/**
 * Validate an enum value against allowed options
 * @param {*} value - Value to validate
 * @param {string[]} allowed - Array of allowed values
 * @returns {{ valid: boolean, message?: string }}
 */
const validateEnum = (value, allowed) => {
  if (isNullOrEmpty(value)) {
    return { valid: true }; // All enum fields are optional
  }
  // Case-insensitive comparison for enum values
  const normalizedValue = value.toString().toLowerCase().trim();
  const normalizedAllowed = allowed.map(v => v.toLowerCase());

  if (!normalizedAllowed.includes(normalizedValue)) {
    return { valid: false, message: `Must be one of: ${allowed.join(', ')}` };
  }
  return { valid: true };
};

/**
 * Validate a year value
 * @param {*} value - Value to validate
 * @returns {{ valid: boolean, message?: string }}
 */
const validateYear = (value) => {
  if (isNullOrEmpty(value)) {
    return { valid: true }; // Year fields are optional
  }
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1850 || num > 2200) {
    return { valid: false, message: 'Must be a valid year (1850-2200)' };
  }
  return { valid: true };
};

// Validation configuration
const NUMERIC_FIELDS = [
  { field: 'legacy_nameplate_capacity_mw', min: 0, max: 50000 },
  { field: 'poi_voltage_kv', min: 0, max: 1500 },
  { field: 'heat_rate_btu_kwh', min: 0, max: 50000 },
  { field: 'capacity_factor_2024', min: 0, max: 100 },
  { field: 'redev_capacity_mw', min: 0, max: 50000 },
  { field: 'redev_heatrate_btu_kwh', min: 0, max: 50000 },
];

const ENUM_FIELDS = {
  status: ['Operating', 'Retired', 'Future', 'Development', 'Proposed', 'Cancelled', 'Unknown'],
  process_type: ['P', 'B'],
  ma_tier: ['Owned', 'Signed', 'Exclusivity', 'Second round', 'First round', 'Pipeline', 'Passed'],
  redev_tier: ['0', '1', '2', '3'],
  redev_land_control: ['Y', 'N'],
  redev_stage_gate: ['0', '1', '2', '3', 'P'],
  // NOTE: iso removed from strict validation - can contain multiple comma-separated values (e.g., "WECC, MISO, SPP")
};

// Valid ISO values for multi-value validation
const VALID_ISOS = ['PJM', 'NYISO', 'ISO-NE', 'MISO', 'SPP', 'ERCOT', 'WECC', 'CAISO', 'SERC'];

const SCORE_FIELDS = [
  { field: 'transactability_scores', min: 1, max: 3 },
  { field: 'environmental_score', min: 0, max: 3 },
  { field: 'thermal_optimization', min: 0, max: 2 },
  { field: 'market_score', min: 0, max: 3 },
  { field: 'infra', min: 0, max: 3 },
  { field: 'ix', min: 0, max: 3 },
];

/**
 * Run all validations on project data
 * @param {object} data - Project data to validate
 * @param {boolean} isCreate - True for create, false for update
 * @returns {Array<{ field: string, message: string }>} - Array of validation errors
 */
const runValidations = (data, isCreate) => {
  const errors = [];

  // Required field: project_name
  if (isCreate) {
    if (isNullOrEmpty(data.project_name)) {
      errors.push({ field: 'project_name', message: 'Project Name is required' });
    }
  } else {
    // On update, project_name cannot be cleared to empty if provided
    if (data.project_name !== undefined && isNullOrEmpty(data.project_name)) {
      errors.push({ field: 'project_name', message: 'Project Name cannot be empty' });
    }
  }

  // Numeric field validation
  NUMERIC_FIELDS.forEach(({ field, min, max }) => {
    if (data[field] !== undefined) {
      const result = validateNumber(data[field], min, max);
      if (!result.valid) {
        errors.push({ field, message: result.message });
      }
    }
  });

  // Score field validation (also numeric but with tighter ranges)
  SCORE_FIELDS.forEach(({ field, min, max }) => {
    if (data[field] !== undefined) {
      const result = validateNumber(data[field], min, max);
      if (!result.valid) {
        errors.push({ field, message: result.message });
      }
    }
  });

  // Enum field validation
  Object.entries(ENUM_FIELDS).forEach(([field, allowed]) => {
    if (data[field] !== undefined) {
      const result = validateEnum(data[field], allowed);
      if (!result.valid) {
        errors.push({ field, message: result.message });
      }
    }
  });

  // Year field validation
  if (data.legacy_cod !== undefined) {
    const result = validateYear(data.legacy_cod);
    if (!result.valid) {
      errors.push({ field: 'legacy_cod', message: result.message });
    }
  }

  return errors;
};

/**
 * Middleware for validating project creation
 */
const validateProjectCreate = (req, res, next) => {
  const errors = runValidations(req.body, true);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      validation_errors: errors,
    });
  }

  next();
};

/**
 * Middleware for validating project updates
 */
const validateProjectUpdate = (req, res, next) => {
  console.log('📋 Validating project update:', JSON.stringify(req.body, null, 2));

  const errors = runValidations(req.body, false);

  if (errors.length > 0) {
    console.log('❌ Validation failed:', errors);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      validation_errors: errors,
    });
  }

  console.log('✅ Validation passed');
  next();
};

module.exports = {
  validateProjectCreate,
  validateProjectUpdate,
  // Export for testing
  isNullOrEmpty,
  validateNumber,
  validateEnum,
  validateYear,
  NUMERIC_FIELDS,
  ENUM_FIELDS,
  SCORE_FIELDS,
};
