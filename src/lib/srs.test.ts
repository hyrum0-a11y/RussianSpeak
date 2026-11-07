import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQueue, DAY, newCard, schedule } from './srs.ts';

const now = 1_700_000_000_000;

test('good grades grow the interval 1d -> 6d -> ~15d', () => {
  let c = schedule(newCard(now), 'good', now);
  assert.equal(c.interval, 1);
  c = schedule(c, 'good', now);
  assert.equal(c.interval, 6);
  c = schedule(c, 'good', now);
  assert.equal(c.interval, 15);
  assert.equal(c.due, now + 15 * DAY);
});

test('again resets reps, lowers ease, and re-shows in 10 minutes', () => {
  const learned = schedule(schedule(newCard(now), 'good', now), 'good', now);
  const c = schedule(learned, 'again', now);
  assert.equal(c.reps, 0);
  assert.equal(c.lapses, 1);
  assert.ok(c.ease < learned.ease);
  assert.equal(c.due, now + 10 * 60 * 1000);
});

test('ease never drops below 1.3', () => {
  let c = newCard(now);
  for (let i = 0; i < 20; i++) c = schedule(c, 'again', now);
  assert.equal(c.ease, 1.3);
});

test('queue puts due cards first, then limited new cards', () => {
  const states = {
    a: { ...newCard(now), due: now - 2 * DAY },
    b: { ...newCard(now), due: now + DAY },
    c: { ...newCard(now), due: now - DAY },
  };
  assert.deepEqual(buildQueue(['a', 'b', 'c', 'x', 'y', 'z'], states, now, 2), ['a', 'c', 'x', 'y']);
});
