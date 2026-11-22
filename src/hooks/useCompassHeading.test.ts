import { describe, it, expect } from 'vitest';
import { readHeading, unwrapHeading } from './useCompassHeading';

describe('unwrapHeading', () => {
  it('takes the short way across north', () => {
    expect(unwrapHeading(359, 1)).toBe(361);
    expect(unwrapHeading(1, 359)).toBe(-1);
    expect(unwrapHeading(720 + 10, 20)).toBe(740);
    expect(unwrapHeading(null, 90)).toBe(90);
  });
});

describe('readHeading', () => {
  const ev = (o: object) => o as unknown as DeviceOrientationEvent;
  it('uses iOS webkitCompassHeading as-is', () => {
    expect(readHeading(ev({ webkitCompassHeading: 45, alpha: 10, absolute: false }), 0)).toBe(45);
  });
  it('converts Android absolute alpha (counter-clockwise) to clockwise heading', () => {
    expect(readHeading(ev({ alpha: 90, absolute: true }), 0)).toBe(270);
  });
  it('adds screen rotation for landscape', () => {
    expect(readHeading(ev({ webkitCompassHeading: 10 }), 90)).toBe(100);
  });
  it('ignores relative (non-absolute) orientation', () => {
    expect(readHeading(ev({ alpha: 90, absolute: false }), 0)).toBeNull();
  });
});
