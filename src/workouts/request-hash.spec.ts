import { hashRequest } from './request-hash';

describe('hashRequest', () => {
  it('ignores object key order', () => {
    expect(hashRequest({ a: 1, b: [{ x: 1, y: 2 }] })).toBe(
      hashRequest({ b: [{ y: 2, x: 1 }], a: 1 }),
    );
  });

  it('respects array order and values', () => {
    expect(hashRequest({ a: [1, 2] })).not.toBe(hashRequest({ a: [2, 1] }));
    expect(hashRequest({ a: 1 })).not.toBe(hashRequest({ a: 2 }));
  });
});
