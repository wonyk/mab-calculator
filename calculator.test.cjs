const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(__dirname + '/calculator.js', 'utf8'), context);
const solve = context.solveMabPlan;
const base = { days: 30, dataDay: 10, actionDay: 11, currentMab: 100000, currentBalance: 100150, target: 100001, transfers: [] };
let p = solve(base);
assert.equal(p.move, -148.5);
assert.ok(p.projectedMab >= base.target);
// A last-day credit contributes one balance-day, not the full remaining month.
p = solve({ ...base, transfers: [{ day: 30, signedAmount: 120 }] });
assert.equal(p.move, -154.5);
assert.equal(p.endBalance, 100115.5);
// A credit already in the balance must not be added again.
assert.equal(solve(base).move, -148.5);
// Last-day action includes that day, while all previous days remain historical.
p = solve({ ...base, dataDay: 29, actionDay: 30 });
assert.equal(p.move, -120);
// Before the first completed day, the previous month contributes zero days.
p = solve({ ...base, dataDay: 0, actionDay: 1, currentMab: 0 });
assert.equal(p.move, -149);
// Future withdrawals constrain liquidity even when MAB allows a larger withdrawal.
p = solve({ ...base, currentMab: 300000, transfers: [{ day: 20, signedAmount: -90000 }] });
assert.equal(p.move, -10150);
assert.equal(p.endBalance, 0);
// Cannot fund a withdrawal from a deposit that posts later on the same day.
p = solve({ ...base, currentMab: 400000, currentBalance: 100, transfers: [{ day: 11, signedAmount: 100000 }] });
assert.equal(p.move, -100);
assert.throws(() => solve({ ...base, actionDay: 20, transfers: [{ day: 12, signedAmount: -200000 }] }));
// Deposits round up to cents; withdrawals round down to cents.
p = solve({ ...base, days: 31, target: 100001.01 });
assert.ok(p.projectedMab >= 100001.01 - 1e-8);
p = solve({ ...base, currentBalance: 99000 });
assert.ok(p.move > 0 && p.projectedMab >= base.target - 1e-8);
// February, leap February, and 31-day months use their own denominators.
for (const days of [28, 29, 30, 31]) {
  p = solve({ ...base, days });
  assert.ok(p.projectedMab >= base.target - 1e-8);
  assert.ok(p.projectedMab < base.target + .01);
}
console.log('12 financial calculation scenarios passed');
