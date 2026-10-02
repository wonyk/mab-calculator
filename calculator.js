// Day-end MAB projection. Historical values include the effective day.
function solveMabPlan({ days, dataDay, actionDay, currentMab, currentBalance, target, transfers }) {
  const activeDays = days - actionDay + 1;
  const historical = currentMab * dataDay;
  const contribution = transfers.reduce((sum, item) => sum + item.signedAmount * (days - item.day + 1), 0);
  const rawMove = (target * days - historical - currentBalance * (days - dataDay) - contribution) / activeDays;
  // Round deposits up and withdrawals down so cents cannot undershoot the target.
  let move = Math.ceil((rawMove - 1e-8) * 100) / 100;
  let balance = currentBalance;
  let beforeAction = currentBalance;
  let minimumAfterAction = Infinity;
  for (let day = dataDay + 1; day <= days; day++) {
    // Same-day credits are available only at day end; do not fund the main withdrawal with them.
    if (day === actionDay) beforeAction = balance;
    balance += transfers.filter(item => item.day === day).reduce((sum, item) => sum + item.signedAmount, 0);
    if (day < actionDay && balance < -1e-8) throw new Error('Planned withdrawals exceed available funds before the chosen transaction date.');
    if (day >= actionDay) minimumAfterAction = Math.min(minimumAfterAction, balance);
  }
  move = Math.max(move, Math.ceil((-Math.min(beforeAction, minimumAfterAction) - 1e-8) * 100) / 100);
  const projectedMab = (historical + currentBalance * (days - dataDay) + contribution + move * activeDays) / days;
  return { move, projectedMab, endBalance: balance + move, actionBalance: beforeAction + move };
}
