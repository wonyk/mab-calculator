const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function load(account, timestamp, storage = new Map()) {
  const elements = new Map();
  function element() {
    return {
      value: '', checked: false, children: [], listeners: {},
      classList: {
        values: new Set(),
        toggle(name, enabled) { if (enabled) this.values.add(name); else this.values.delete(name); },
        add(name) { this.values.add(name); }, remove(name) { this.values.delete(name); },
        contains(name) { return this.values.has(name); },
      },
      append(...items) {
        this.children.push(...items);
        for (const item of items) if (item.selected) this.value = String(item.value);
      },
      replaceChildren(...items) { this.children = items; },
      querySelector() { return null; }, querySelectorAll() { return []; },
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      removeAttribute(name) { delete this.attributes[name]; },
      closest() { return this; },
      focus() { this.focused = true; },
      addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); },
      change() { for (const callback of this.listeners.change || []) callback(); },
    };
  }
  const document = {
    querySelector(id) {
      if (!elements.has(id)) {
        const item = element();
        item.id = id.slice(1);
        elements.set(id, item);
      }
      return elements.get(id);
    },
    createElement: element, addEventListener() {},
  };
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [timestamp])); }
  }
  const context = vm.createContext({
    document, Date: FixedDate, Intl, URL, URLSearchParams,
    window: { location: { search: `?account=${account}` }, localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); },
      removeItem(key) { storage.delete(key); },
    } },
  });
  vm.runInContext(fs.readFileSync(__dirname + '/calculator.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync(__dirname + '/script.js', 'utf8'), context);
  return { context, get: id => document.querySelector('#' + id) };
}

for (const account of ['ocbc', 'uob-stash']) {
  const { context, get } = load(account, '2026-10-03T04:00:00Z');
  assert.equal(get('effectiveDate').value, '2026-10-02');
  assert.equal(get('actionDate').value, '2026-10-03');
  assert.equal(get('actionDate').min, '2026-10-03');
  assert.equal(get('effectiveDate').max, '2026-10-02');
  assert.match(get('dateSummary').textContent, /MAB through 2 Oct 2026.*on 3 Oct 2026/);
  get('actionDate').value = '2026-10-10';
  get('actionDate').change();
  get('actionDate').value = '2026-10-03';
  get('actionDate').change();
  assert.equal(get('actionDate').value, '2026-10-03');
  get('effectiveDate').value = '2026-10-03';
  get('effectiveDate').change();
  assert.equal(get('effectiveDate').value, '2026-10-02');
  assert.equal(get('actionDate').value, '2026-10-03');
  const plan = context.calculatePlan(new Map([
    ['account', account], ['month', '9'], ['effectiveDate', get('effectiveDate').value],
    ['actionDate', get('actionDate').value], ['currentMab', '50000'],
    ['currentBalance', '50100'], ['previousMab', '50000'], ['buffer', '1'],
    ['mabIncrease', '0'], ['goalIncrease', '500'],
  ]));
  assert.equal(plan.actionDate.getDate(), 3);
  get('useOlderMab').checked = true;
  get('useOlderMab').change();
  assert.equal(get('effectiveDateLabel').classList.contains('hidden'), false);
  get('effectiveDate').value = '2026-10-01';
  get('effectiveDate').change();
  assert.equal(get('effectiveDate').value, '2026-10-01');
  assert.equal(get('actionDate').value, '2026-10-03');
  get('actionDate').value = '2026-10-10';
  get('actionDate').change();
  assert.equal(get('effectiveDate').value, '2026-10-01');
  get('useOlderMab').checked = false;
  get('useOlderMab').change();
  assert.equal(get('effectiveDateLabel').classList.contains('hidden'), true);
  assert.equal(get('effectiveDate').value, '2026-10-02');
  assert.equal(get('actionDate').value, '2026-10-10');
  assert.match(get('dateSummary').textContent, /MAB through 2 Oct 2026.*on 10 Oct 2026/);
  get('month').value = '10';
  get('month').change();
  assert.equal(get('effectiveDate').value, '2026-10-31');
  assert.equal(get('actionDate').value, '2026-11-01');
  get('actionDate').value = '2026-11-05';
  get('actionDate').change();
  assert.equal(get('actionDate').value, '2026-11-05');
}
for (const timestamp of ['2026-10-01T04:00:00Z', '2027-01-01T04:00:00Z']) {
  const { get } = load('uob-stash', timestamp);
  assert.equal(get('actionDate').value, timestamp.slice(0, 10));
  assert.equal(get('actionDate').min, timestamp.slice(0, 10));
  assert.ok(get('effectiveDate').value < get('actionDate').value);
}
{
  const { context, get } = load('uob-stash', '2026-10-01T04:00:00Z');
  assert.equal(get('advancedPanel').classList.contains('hidden'), true);
  assert.equal(get('baseRate').disabled, true);
  get('advancedMode').checked = true;
  get('advancedMode').change();
  assert.equal(get('advancedPanel').classList.contains('hidden'), false);
  assert.equal(get('baseRate').disabled, false);
  const data = new Map([
    ['account', 'uob-stash'], ['month', '9'], ['effectiveDate', '2026-09-30'],
    ['actionDate', '2026-10-01'], ['currentMab', '0'], ['currentBalance', '50100'],
    ['previousMab', '50000'], ['buffer', '1'], ['advancedMode', 'on'],
    ['baseRate', '0.05'], ['yearDays', '365'], ['trialWithdrawal', '100'],
  ]);
  let plan = context.calculatePlan(data);
  assert.equal(plan.todayTransferAmount, -99.06);
  assert.equal(plan.forecast.estimatedBaseInterest, 2.12);
  assert.equal(plan.trial.meetsRequirement, true);
  assert.equal(plan.trial.meetsTarget, false);
  context.renderResults(plan);
  let grid = get('results').children[0];
  assert.match(grid.children[0].children[0].textContent, /You can withdraw up to.*today/);
  assert.match(grid.children[0].children[3].textContent, /Keep at least SGD.*50,000.94/);
  assert.equal(grid.children[1].children[2].textContent, 'Meets requirement but below buffer');
  assert.match(grid.children[2].children[0].children[2].textContent, /Adds SGD.*0.07.*final-day credit/);
  data.set('trialWithdrawal', '99.06');
  context.renderResults(context.calculatePlan(data));
  assert.equal(get('results').children[0].children[1].children[2].textContent, 'Meets requirement and buffer');
  data.set('trialWithdrawal', '101');
  context.renderResults(context.calculatePlan(data));
  assert.equal(get('results').children[0].children[1].children[2].textContent, 'Below requirement');
  data.set('trialWithdrawal', '100');
  context.renderMathBreakdown(plan);
  data.set('trialWithdrawal', '50101');
  plan = context.calculatePlan(data);
  assert.ok(plan.trial.error);
  assert.match(plan.trial.error, /by S\$1.00.*Reduce it to S\$50,100.00/);
  assert.equal(plan.todayTransferAmount, -99.06);
  context.renderResults(plan);
  data.set('advancedMode', '');
  assert.equal(context.calculatePlan(data).todayTransferAmount, -99);
  data.set('advancedMode', 'on');
  data.set('baseRate', '');
  assert.throws(() => context.calculatePlan(data));
  data.set('account', 'ocbc');
  data.set('mabIncrease', '0');
  data.set('goalIncrease', '500');
  data.set('currentMab', '50000');
  data.set('baseRate', '0.05');
  data.set('trialWithdrawal', '90');
  assert.equal(context.calculatePlan(data).advanced, true);
  get('account').value = 'ocbc';
  context.syncAccount();
  assert.equal(get('advancedMode').checked, false);
  assert.equal(get('advancedPanel').classList.contains('hidden'), true);
  assert.equal(get('baseRate').disabled, true);
}
{
  const { context, get } = load('ocbc', '2026-10-04T04:00:00Z');
  assert.equal(get('advancedMode').checked, false);
  assert.equal(get('advancedPanel').classList.contains('hidden'), true);
  get('advancedMode').checked = true;
  get('advancedMode').change();
  assert.equal(get('baseRate').disabled, false);
  assert.equal(get('expectedBonus').disabled, false);
  assert.match(get('bonusForecastHelp').textContent, /optional OCBC bonus/);
  const data = new Map([
    ['account', 'ocbc'], ['month', '9'], ['effectiveDate', '2026-10-03'],
    ['actionDate', '2026-10-04'], ['currentMab', '50000'], ['mabIncrease', '500'],
    ['currentBalance', '50100'], ['goalIncrease', '500'], ['advancedMode', 'on'],
    ['baseRate', '0.05'], ['yearDays', '365'], ['trialWithdrawal', '90'],
    ['expectedBonus', '0'],
  ]);
  let plan = context.calculatePlan(data);
  assert.equal(plan.previousMonthMab, 49500);
  assert.equal(plan.targetMab, 50000);
  assert.equal(plan.bufferedTargetMab, 50010);
  assert.equal(plan.trial.actionBalance, 50010);
  assert.equal(plan.trial.estimatedBaseInterest, 2.12);
  assert.equal(plan.trial.balanceDays, 1550280);
  assert.equal(plan.trial.meetsRequirement, true);
  assert.equal(plan.trial.meetsTarget, false);
  context.renderResults(plan);
  const grid = get('results').children[0];
  const notes = grid.children[grid.children.length - 1];
  assert.equal(notes.children[0].textContent, 'Notes and assumptions');
  assert.ok(!notes.open);
  assert.equal(grid.children[1].children[0].textContent, 'Forecast after your SGD 90.00 withdrawal');
  data.set('expectedBonus', '100');
  data.set('bonusDate', '2026-10-10');
  plan = context.calculatePlan(data);
  assert.equal(plan.trial.balanceDays, 1552480);
  assert.equal(plan.trial.meetsTarget, true);
  assert.equal(plan.expectedBonus, 100);
  context.renderResults(plan);
  context.renderMathBreakdown(plan);
  data.set('bonusDate', '2026-10-03');
  assert.throws(() => context.calculatePlan(data), /already credited/);
  data.set('bonusDate', '2026-11-01');
  assert.throws(() => context.calculatePlan(data), /selected month/);
  data.set('advancedMode', '');
  assert.equal(context.calculatePlan(data).expectedBonus, 0);
  assert.equal(context.calculatePlan(data).trial, null);
  data.set('advancedMode', 'on');
  data.set('expectedBonus', '1000');
  data.set('bonusDate', '2026-10-05');
  data.set('actionDate', '2026-10-10');
  data.set('currentBalance', '1000');
  get('plannedTransfers').querySelectorAll = () => [{
    querySelector(selector) {
      return { value: selector === '.transfer-day' ? '6' : selector === '.transfer-type' ? 'withdrawal' : '1500' };
    },
  }];
  plan = context.calculatePlan(data);
  assert.equal(plan.basicMove, null);
  assert.ok(!plan.trial.error);
  assert.equal(plan.trial.actionBalance, 410);
  get('plannedTransfers').querySelectorAll = () => [];
  data.set('actionDate', '2026-10-04');
  data.set('trialWithdrawal', '1100');
  assert.match(context.calculatePlan(data).trial.error, /available/);
  get('account').value = 'uob-stash';
  context.syncAccount();
  assert.equal(get('advancedMode').checked, false);
  assert.equal(get('expectedBonus').disabled, true);
  get('advancedMode').checked = true;
  get('advancedMode').change();
  assert.equal(get('expectedBonus').disabled, true);
  assert.equal(get('bonusAmountLabel').classList.contains('hidden'), true);
  assert.doesNotMatch(get('bonusForecastHelp').textContent, /OCBC/);
  assert.match(get('bonusForecastHelp').textContent, /Include already credited base and bonus interest/);
  get('account').value = 'ocbc';
  context.syncAccount();
  assert.match(get('bonusForecastHelp').textContent, /optional OCBC bonus/);
}
console.log('Date selection regressions passed for both accounts and month/year boundaries.');
console.log('OCBC custom forecast, pending bonus timing and collapsed notes passed.');
console.log('Both-account advanced forecasts and simple defaults passed.');

{
  const storage = new Map();
  let { context, get } = load('uob-stash', '2026-10-04T04:00:00Z', storage);
  get('currentBalance').value = '51234.56';
  get('currentMab').value = '51000';
  get('previousMab').value = '50999';
  get('mab-form').listeners.input[0]({ target: get('currentBalance') });
  assert.match(get('results').children[0].textContent, /Calculate again/);
  assert.match(get('savedInputsNote').textContent, /Figures last edited.*4 Oct 2026/);
  get('buffer').value = '2';
  context.saveAccountInputs('buffer');
  const editedAt = JSON.parse(storage.get('mab-calculator.inputs.uob-stash')).figuresEditedAt;
  get('account').value = 'ocbc';
  context.syncAccount();
  assert.equal(get('currentBalance').value, '0');
  get('currentBalance').value = '61234';
  get('currentMab').value = '61000';
  get('mabIncrease').value = '100';
  context.saveAccountInputs('currentBalance');
  get('trialWithdrawal').value = '20';
  get('expectedBonus').value = '500';
  get('account').value = 'uob-stash';
  context.syncAccount();
  assert.equal(get('currentBalance').value, '51234.56');
  assert.equal(get('previousMab').value, '50999');
  assert.equal(get('buffer').value, '2');
  assert.equal(get('trialWithdrawal').value, '');
  assert.equal(get('expectedBonus').value, '0');
  assert.equal(get('advancedMode').checked, false);
  ({ context, get } = load('uob-stash', '2026-10-05T04:00:00Z', storage));
  assert.equal(get('currentBalance').value, '51234.56');
  assert.equal(get('effectiveDate').value, '2026-10-04');
  assert.equal(get('actionDate').value, '2026-10-05');
  assert.match(get('savedInputsNote').textContent, /4 Oct 2026.*Review/);
  get('buffer').value = '3';
  context.saveAccountInputs('buffer');
  assert.equal(JSON.parse(storage.get('mab-calculator.inputs.uob-stash')).figuresEditedAt, editedAt);
  get('clearSavedButton').listeners.click[0]();
  assert.equal(storage.has('mab-calculator.inputs.uob-stash'), false);
  assert.equal(get('currentBalance').value, '50000');
  assert.equal(get('buffer').value, '1');
  assert.equal(storage.has('mab-calculator.inputs.ocbc'), true);
  ({ get } = load('ocbc', '2026-11-01T04:00:00Z', storage));
  assert.equal(get('currentBalance').value, '61234');
  assert.equal(get('mabIncrease').value, '100');
  assert.equal(get('actionDate').value, '2026-11-01');
}
{
  const corrupt = new Map([['mab-calculator.inputs.uob-stash', '{broken']]);
  let { get } = load('uob-stash', '2026-10-04T04:00:00Z', corrupt);
  assert.equal(get('currentBalance').value, '50000');
  assert.doesNotMatch(get('savedInputsNote').textContent, /cannot be saved/);
  const blocked = { get() { throw new Error('blocked'); }, set() { throw new Error('blocked'); } };
  const app = load('uob-stash', '2026-10-04T04:00:00Z', blocked);
  app.context.saveAccountInputs('currentBalance');
  assert.match(app.get('savedInputsNote').textContent, /cannot be saved/);
  assert.equal(app.get('actionDate').value, '2026-10-04');
}
{
  const storage = new Map();
  let { context, get } = load('uob-stash', '2026-10-04T04:00:00Z', storage);
  get('buffer').value = '2';
  context.saveAccountInputs('buffer');
  assert.match(get('savedInputsNote').textContent, /^Settings saved/);
  assert.doesNotMatch(get('savedInputsNote').textContent, /1970/);
  ({ context, get } = load('uob-stash', '2026-10-05T04:00:00Z', storage));
  assert.equal(get('buffer').value, '2');
  assert.match(get('savedInputsNote').textContent, /^Settings saved/);
  get('currentBalance').value = '-1';
  context.saveAccountInputs('currentBalance');
  assert.equal(JSON.parse(storage.get('mab-calculator.inputs.uob-stash')).values.currentBalance, '50000');
}
{
  const { context, get } = load('uob-stash', '2026-10-04T04:00:00Z');
  const input = get('currentBalance');
  input.willValidate = true;
  input.validity = { valid: false, rangeUnderflow: true };
  input.min = '0';
  get('mab-form').querySelectorAll = selector => selector === 'input, select' ? [input] : [];
  assert.equal(context.validateFormFields(), false);
  assert.equal(input.attributes['aria-invalid'], 'true');
  assert.equal(input.children[0].textContent, 'Enter 0 or more.');
  assert.equal(input.focused, true);
}
{
  const version = fs.readFileSync(__dirname + '/VERSION', 'utf8').trim();
  const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  assert.ok(html.includes(`id="appVersion">${version}</span>`));
  for (const file of ['styles.css', 'calculator.js', 'script.js']) assert.ok(html.includes(`${file}?v=${version}`));
}
console.log('Saved account isolation, refreshed dates, storage failures, inline errors and visible version passed.');
