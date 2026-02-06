import { describe, it, expect } from 'vitest';
import { parseTransmissionData } from './calculations';

describe('parseTransmissionData', () => {
  it('returns empty array for null/undefined/empty input', () => {
    expect(parseTransmissionData(null)).toEqual([]);
    expect(parseTransmissionData(undefined)).toEqual([]);
    expect(parseTransmissionData('')).toEqual([]);
    expect(parseTransmissionData('   ')).toEqual([]);
  });

  it('parses a single transmission point', () => {
    const result = parseTransmissionData('69 kV|143.9|144.2|-|true');
    expect(result).toEqual([{
      voltage: '69 kV',
      injectionCapacity: 143.9,
      withdrawalCapacity: 144.2,
      constraints: '-',
      hasExcessCapacity: true
    }]);
  });

  it('parses multiple transmission points separated by semicolons', () => {
    const result = parseTransmissionData('69 kV|143.9|144.2|-|true;138 kV|549.5|95.5|-|true');
    expect(result).toHaveLength(2);
    expect(result[0].voltage).toBe('69 kV');
    expect(result[1].voltage).toBe('138 kV');
    expect(result[1].injectionCapacity).toBe(549.5);
  });

  it('handles false excess capacity flag', () => {
    const result = parseTransmissionData('115 kV|21.5|136.0|13|false');
    expect(result[0].hasExcessCapacity).toBe(false);
    expect(result[0].constraints).toBe('13');
  });

  it('handles malformed data gracefully', () => {
    const result = parseTransmissionData('incomplete|data');
    expect(result).toEqual([]);
  });
});
