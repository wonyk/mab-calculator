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

const advanced = { days: 31, dataDay: 0, actionDay: 1, currentMab: 0, currentBalance: 50100, target: 50001, transfers: [], baseInterest: { rate: 0.0005, yearDays: 365 } };
p = solve(advanced);
assert.equal(p.move, -99.06);
assert.equal(p.estimatedBaseInterest, 2.12);
assert.ok(Math.abs(p.mabBeforeInterest - 50000.94) < 1e-8);
assert.ok(p.projectedMab >= advanced.target);
assert.ok(p.projectedMab < advanced.target + 0.01);
assert.ok(Math.abs(p.endBalance - 50003.06) < 1e-8);
// One cent more withdrawal fails: recommendation is maximal at cent precision.
const project = context.projectMabMove;
assert.ok(project(advanced, p.move - 0.01).projectedMab < advanced.target);
assert.ok(Math.abs((p.projectedMab - p.mabBeforeInterest) - 2.12 / 31) < 1e-8);
// Forecast for a user-chosen withdrawal includes the entire month's interest.
p = project(advanced, -100);
assert.equal(p.mabBeforeInterest, 50000);
assert.equal(p.estimatedBaseInterest, 2.12);
assert.ok(p.projectedMab < advanced.target);
// Accrued interest from completed days is included even with a last-day withdrawal.
p = solve({ ...advanced, dataDay: 30, actionDay: 31, currentMab: 50000 });
assert.equal(p.estimatedBaseInterest, 2.12);
assert.equal(p.move, -71.12);
assert.ok(p.projectedMab >= advanced.target - 1e-8);
// Planned cash flows earn interest only after their posting days.
p = project({ ...advanced, currentBalance: 50000, transfers: [{ day: 16, signedAmount: 10000 }] }, 0);
assert.ok(Math.abs(p.mabBeforeInterest - 1710000 / 31) < 1e-8);
assert.equal(p.estimatedBaseInterest, 2.34);
// Forecast credits cannot fund a last-day withdrawal or earlier planned outflows.
assert.throws(() => project({ ...advanced, actionDay: 31 }, -50101));
assert.throws(() => project(advanced, -50200), /by S\$100.00 on day 1/);
assert.throws(() => solve({ ...advanced, actionDay: 10, transfers: [{ day: 5, signedAmount: -50200 }] }), /by S\$100.00 on day 5.*earlier deposit/);
assert.throws(() => project({ ...advanced, transfers: [{ day: 5, signedAmount: -100 }] }, -50100), /short by S\$100.00 on day 5/);
p = solve({ ...base, currentMab: 300000, transfers: [{ day: 20, signedAmount: -90000 }], baseInterest: advanced.baseInterest });
assert.equal(p.move, -10150);
assert.equal(p.endBalanceBeforeInterest, 0);
// Disabled or zero-rate interest reproduces the basic recommendation.
assert.equal(solve({ ...base, baseInterest: { rate: 0, yearDays: 365 } }).move, solve(base).move);
for (const days of [28, 29, 30, 31]) {
  for (const yearDays of [365, 366]) {
    const options = { ...advanced, days, baseInterest: { rate: 0.0005, yearDays } };
    p = solve(options);
    assert.ok(p.projectedMab >= options.target - 1e-8);
    assert.ok(project(options, p.move - 0.01).projectedMab < options.target);
    assert.ok(p.estimatedBaseInterest > 0);
  }
}
// Base interest still applies above the Stash bonus-interest cap.
p = project({ ...advanced, currentBalance: 200000 }, 0);
assert.equal(p.estimatedBaseInterest, 8.49);
console.log('Advanced interest, trial withdrawal, liquidity, month-length and day-count checks passed');
