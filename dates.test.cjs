const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function load(account, timestamp) {
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
      setAttribute() {},
      addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); },
      change() { for (const callback of this.listeners.change || []) callback(); },
    };
  }
  const document = {
    querySelector(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    createElement: element, addEventListener() {},
  };
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [timestamp])); }
  }
  const context = vm.createContext({
    document, Date: FixedDate, Intl, URL, URLSearchParams,
    window: { location: { search: `?account=${account}` } },
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
console.log('Date selection regressions passed for both accounts and month/year boundaries.');
