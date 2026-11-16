const PLAIN_DECIMAL = /^-?\d+(\.\d+)?$/;

const toScaled = (value: string): { digits: bigint; scale: number } => {
  if (!PLAIN_DECIMAL.test(value)) throw new Error(`Not a plain decimal: ${value}`);
  const [integer, fraction = ''] = value.split('.');
  return { digits: BigInt(`${integer}${fraction}`), scale: fraction.length };
};

export const multiplyDecimals = (a: string, b: string): string => {
  const left = toScaled(a);
  const right = toScaled(b);
  const scale = left.scale + right.scale;
  const product = left.digits * right.digits;
  const negative = product < 0n;
  const digits = (negative ? -product : product).toString().padStart(scale + 1, '0');
  const integer = digits.slice(0, digits.length - scale);
  const fraction = digits.slice(digits.length - scale).replace(/0+$/, '');
  return `${negative ? '-' : ''}${integer}${fraction === '' ? '' : `.${fraction}`}`;
};
