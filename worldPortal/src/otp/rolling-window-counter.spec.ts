import { RollingWindowCounter } from './rolling-window-counter';

describe('RollingWindowCounter', () => {
  it('counts only events inside the window', () => {
    const counter = new RollingWindowCounter(1000);
    counter.record('a', 0);
    counter.record('a', 500);

    expect(counter.count('a', 999)).toBe(2);
    expect(counter.count('a', 1000)).toBe(1);
    expect(counter.count('a', 1500)).toBe(0);
    expect(counter.count('b', 0)).toBe(0);
  });

  it('says how long until the oldest event leaves the window', () => {
    const counter = new RollingWindowCounter(1000);
    counter.record('a', 200);
    counter.record('a', 700);

    expect(counter.msUntilNextFree('a', 900)).toBe(300);
    expect(counter.msUntilNextFree('nobody', 900)).toBe(0);
  });

  it('forgets keys nobody reads again once it grows past its sweep size', () => {
    const counter = new RollingWindowCounter(1000, 3);
    for (const key of ['a', 'b', 'c']) counter.record(key, 0);
    counter.record('d', 5000);

    const size = (counter as unknown as { events: Map<string, number[]> })
      .events.size;
    expect(size).toBe(1);
  });
});
