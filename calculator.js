// Day-end MAB projection. Historical values include the effective day.
function solveMabPlan({ days, dataDay, actionDay, currentMab, currentBalance, target, transfers, baseInterest = null }) {
  const activeDays = days - actionDay + 1;
  const historical = currentMab * dataDay;
  const contribution = transfers.reduce((sum, item) => sum + item.signedAmount * (days - item.day + 1), 0);
  const unchangedBalanceDays = historical + currentBalance * (days - dataDay) + contribution;
  const dailyRate = baseInterest ? baseInterest.rate / baseInterest.yearDays : 0;
  const rawMove = (target * days / (1 + dailyRate) - unchangedBalanceDays) / activeDays;
  // Round deposits up and withdrawals down so cents cannot undershoot the target.
  let move = Math.ceil((rawMove - 1e-8) * 100) / 100;
  let balance = currentBalance;
  let beforeAction = currentBalance;
  let minimumAfterAction = Infinity;
  for (let day = dataDay + 1; day <= days; day++) {
    // Same-day credits are available only at day end; do not fund the main withdrawal with them.
    if (day === actionDay) beforeAction = balance;
    balance += transfers.filter(item => item.day === day).reduce((sum, item) => sum + item.signedAmount, 0);
    if (day < actionDay && balance < -1e-8) throw new Error(`Planned withdrawals exceed available funds by ${shortfallMoney(-balance)} on day ${day}, before your chosen transaction date. Reduce that withdrawal or add an earlier deposit.`);
    if (day >= actionDay) minimumAfterAction = Math.min(minimumAfterAction, balance);
  }
  move = Math.max(move, Math.ceil((-Math.min(beforeAction, minimumAfterAction) - 1e-8) * 100) / 100);
  // Interest changes with the withdrawal. Recheck the target after rounding the credit.
  const options = { days, dataDay, actionDay, currentMab, currentBalance, transfers, baseInterest };
  let projection = projectMabMove(options, move);
  while (projection.projectedMab < target - 1e-8) {
    move = Math.round((move + 0.01) * 100) / 100;
    projection = projectMabMove(options, move);
  }
  return { move, ...projection };
}

// Project a specific move. Base interest is earned on balances before its own credit.
// Historical MAB supplies the balance-days already accrued in this month.
function projectMabMove({ days, dataDay, actionDay, currentMab, currentBalance, transfers, baseInterest = null }, move) {
  let balance = currentBalance;
  let balanceDays = currentMab * dataDay;
  let actionBalance = currentBalance;
  for (let day = dataDay + 1; day <= days; day++) {
    if (day === actionDay) {
      if (balance + move < -1e-8) throw new Error(`Withdrawal exceeds the available balance by ${shortfallMoney(-(balance + move))} on day ${day}. Reduce it to ${shortfallMoney(balance)} or less, or add an earlier deposit.`);
      balance += move;
      actionBalance = balance;
    }
    balance += transfers.filter(item => item.day === day).reduce((sum, item) => sum + item.signedAmount, 0);
    if (balance < -1e-8) throw new Error(`This withdrawal leaves insufficient funds for planned transfers: short by ${shortfallMoney(-balance)} on day ${day}. Reduce the withdrawal or add a deposit by that day.`);
    balanceDays += balance;
  }
  const estimatedBaseInterest = baseInterest
    ? Math.floor((balanceDays * baseInterest.rate / baseInterest.yearDays + 1e-10) * 100) / 100
    : 0;
  return {
    balanceDays,
    mabBeforeInterest: balanceDays / days,
    estimatedBaseInterest,
    // A final-day credit contributes exactly one balance-day to MAB.
    projectedMab: (balanceDays + estimatedBaseInterest) / days,
    endBalanceBeforeInterest: balance,
    endBalance: balance + estimatedBaseInterest,
    actionBalance,
  };
}

function shortfallMoney(amount) {
  return `S$${(Math.ceil((amount - 1e-8) * 100) / 100).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
