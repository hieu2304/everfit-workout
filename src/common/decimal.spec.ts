import { multiplyDecimals } from './decimal';

describe('multiplyDecimals', () => {
  it.each([
    ['225', '0.45359237', '102.05828325'],
    ['100.25', '0.45359237', '45.4726350925'],
    ['60.5', '1', '60.5'],
    ['0', '0.45359237', '0'],
    ['2000', '0.45359237', '907.18474'],
    ['0.01', '0.45359237', '0.0045359237'],
  ])('%s x %s = %s', (a, b, expected) => {
    expect(multiplyDecimals(a, b)).toBe(expected);
  });

  it('rejects non-decimal input', () => {
    expect(() => multiplyDecimals('1e3', '1')).toThrow('Not a plain decimal: 1e3');
  });
});
