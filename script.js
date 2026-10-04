const monthSelect = document.querySelector("#month");
const effectiveDateInput = document.querySelector("#effectiveDate");
const useOlderMabInput = document.querySelector("#useOlderMab");
const actionDateInput = document.querySelector("#actionDate");
const form = document.querySelector("#mab-form");
const results = document.querySelector("#results");
const addTransferButton = document.querySelector("#addTransferButton");
const plannedTransfers = document.querySelector("#plannedTransfers");
const mathModal = document.querySelector("#mathModal");
const closeModalButton = document.querySelector("#closeModalButton");
const mathBreakdown = document.querySelector("#mathBreakdown");

const singaporeParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
const datePart = type => singaporeParts.find(part => part.type === type).value;
const now = new Date(Number(datePart("year")), Number(datePart("month")) - 1, Number(datePart("day")));
now.setHours(12, 0, 0, 0);
const currentYear = now.getFullYear();
const currentMonthIndex = now.getMonth();
const currentDay = now.getDate();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(monthIndex, year = currentYear) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDate(value) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T12:00:00`);
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  nextDate.setHours(12, 0, 0, 0);
  return nextDate;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildMonthDate(monthIndex, day) {
  const date = new Date(currentYear, monthIndex, day);
  date.setHours(12, 0, 0, 0);
  return date;
}

function populateMonths() {
  monthNames.forEach((monthName, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${monthName} (${getDaysInMonth(index)} days)`;

    if (index === currentMonthIndex) {
      option.selected = true;
    }

    monthSelect.append(option);
  });
}

function getSelectedDaysInMonth() {
  return getDaysInMonth(Number(monthSelect.value));
}

function getMinimumSelectableDay() {
  const selectedMonth = Number(monthSelect.value);
  return document.querySelector("#account").value === "uob-stash" ? 1 : selectedMonth === currentMonthIndex ? currentDay : 1;
}

function clearElement(element) {
  element.replaceChildren();
}

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }
  if (options.text) {
    element.textContent = options.text;
  }
  if (options.htmlFor) {
    element.htmlFor = options.htmlFor;
  }
  if (options.type) {
    element.type = options.type;
  }
  if (options.value !== undefined) {
    element.value = options.value;
  }
  if (options.min !== undefined) {
    element.min = String(options.min);
  }
  if (options.max !== undefined) {
    element.max = String(options.max);
  }
  if (options.step !== undefined) {
    element.step = String(options.step);
  }
  if (options.required) {
    element.required = true;
  }
  if (options.name) {
    element.name = options.name;
  }

  return element;
}

function renderEmptyTransfers() {
  if (plannedTransfers.children.length === 0) {
    const minimumDay = getMinimumSelectableDay();
    const emptyText = minimumDay > getSelectedDaysInMonth()
      ? "No transaction days remain in this month."
      : "No planned transfers added yet.";
    const message = createElement("p", { className: "empty-transfers", text: emptyText });
    plannedTransfers.replaceChildren(message);
  }
}

function createTransferRow() {
  const minimumDay = getMinimumSelectableDay();
  if (minimumDay > getSelectedDaysInMonth()) {
    return;
  }

  if (plannedTransfers.querySelector(".empty-transfers")) {
    clearElement(plannedTransfers);
  }

  const row = createElement("div", { className: "planned-transfer-row" });

  const dayLabel = createElement("label");
  const dayText = createElement("span", { text: "Transaction day" });
  const dayInput = createElement("input", {
    className: "transfer-day",
    type: "number",
    min: 2,
    step: 1,
    required: true,
  });
  dayLabel.append(dayText, dayInput);

  const typeLabel = createElement("label");
  const typeText = createElement("span", { text: "Type" });
  const typeSelect = createElement("select", { className: "transfer-type" });
  const depositOption = createElement("option", { text: "Deposit", value: "deposit" });
  const withdrawalOption = createElement("option", { text: "Withdrawal", value: "withdrawal" });
  typeSelect.append(depositOption, withdrawalOption);
  typeLabel.append(typeText, typeSelect);

  const amountLabel = createElement("label");
  const amountText = createElement("span", { text: "Amount" });
  const amountInput = createElement("input", {
    className: "transfer-amount",
    type: "number",
    min: 0,
    step: 0.01,
    value: "0",
    required: true,
  });
  amountLabel.append(amountText, amountInput);

  const removeButton = createElement("button", {
    className: "remove-transfer secondary-button",
    type: "button",
    text: "Remove",
  });

  row.append(dayLabel, typeLabel, amountLabel, removeButton);

  plannedTransfers.append(row);
  syncTransferRowLimits(row);
}

function syncTransferRowLimits(row) {
  const dayInput = row.querySelector(".transfer-day");
  const daysInMonth = getSelectedDaysInMonth();
  const effective = parseInputDate(effectiveDateInput.value);
  const historicalDay = effective && effective.getMonth() === Number(monthSelect.value) ? effective.getDate() : 0;
  const minFutureDay = Math.min(daysInMonth, Math.max(getMinimumSelectableDay(), historicalDay + 1));

  dayInput.min = String(minFutureDay);
  dayInput.max = String(daysInMonth);

  if (!dayInput.value) {
    dayInput.value = String(minFutureDay);
  } else if (Number(dayInput.value) < minFutureDay) {
    dayInput.value = String(minFutureDay);
  } else if (Number(dayInput.value) > daysInMonth) {
    dayInput.value = String(daysInMonth);
  }
}

function syncAllTransferRows() {
  const rows = plannedTransfers.querySelectorAll(".planned-transfer-row");
  addTransferButton.disabled = getMinimumSelectableDay() > getSelectedDaysInMonth();
  rows.forEach(syncTransferRowLimits);
  renderEmptyTransfers();
}

function syncDates() {
  const selectedMonth = Number(monthSelect.value);
  const daysInMonth = getDaysInMonth(selectedMonth);
  const currentEffectiveDate = parseInputDate(effectiveDateInput.value);
  const currentActionDate = parseInputDate(actionDateInput.value);
  const precedingMonthEnd = buildMonthDate(selectedMonth, 0);
  const monthEnd = buildMonthDate(selectedMonth, daysInMonth);
  const defaultDate = selectedMonth === currentMonthIndex ? yesterday : precedingMonthEnd;
  const latestEffectiveDate = selectedMonth === currentMonthIndex ? yesterday : addDays(monthEnd, -1);
  const effectiveInMonth = currentEffectiveDate && currentEffectiveDate >= precedingMonthEnd && currentEffectiveDate <= monthEnd;
  const syncedDate = useOlderMabInput.checked && effectiveInMonth && currentEffectiveDate <= latestEffectiveDate ? currentEffectiveDate : defaultDate;
  const defaultActionDate = selectedMonth === currentMonthIndex ? now : buildMonthDate(selectedMonth, 1);
  const minimumActionDate = addDays(syncedDate, 1);
  const actionInMonth = currentActionDate && currentActionDate.getFullYear() === currentYear && currentActionDate.getMonth() === selectedMonth;
  let syncedActionDate = actionInMonth ? currentActionDate : defaultActionDate;
  if (syncedActionDate < minimumActionDate) syncedActionDate = minimumActionDate;
  const minimumDayDate = buildMonthDate(selectedMonth, getMinimumSelectableDay());
  if (syncedActionDate < minimumDayDate) syncedActionDate = minimumDayDate;

  effectiveDateInput.min = formatDateForInput(precedingMonthEnd);
  effectiveDateInput.max = formatDateForInput(latestEffectiveDate);
  actionDateInput.min = formatDateForInput(minimumActionDate > minimumDayDate ? minimumActionDate : minimumDayDate);
  actionDateInput.max = formatDateForInput(monthEnd);
  effectiveDateInput.value = formatDateForInput(syncedDate);
  actionDateInput.value = formatDateForInput(syncedActionDate);

  syncAllTransferRows();
}

function getPlannedTransferItems() {
  const rows = plannedTransfers.querySelectorAll(".planned-transfer-row");

  return Array.from(rows).map((row) => {
    const day = Number(row.querySelector(".transfer-day").value);
    const type = row.querySelector(".transfer-type").value;
    const amount = Number(row.querySelector(".transfer-amount").value);
    const signedAmount = type === "deposit" ? amount : -amount;

    return {
      day,
      type,
      amount,
      signedAmount,
    };
  });
}

function calculatePlan(formData) {
  const monthIndex = Number(formData.get("month"));
  const effectiveDate = parseInputDate(formData.get("effectiveDate"));
  const actionDate = parseInputDate(formData.get("actionDate"));
  const isStash = formData.get("account") === "uob-stash";
  const advanced = formData.get("advancedMode") === "on";
  const goalIncrease = isStash ? 0 : Number(formData.get("goalIncrease") || 500);
  const currentMab = Number(formData.get("currentMab"));
  const mabIncrease = Number(formData.get("mabIncrease"));
  const currentBalance = Number(formData.get("currentBalance"));
  const daysInMonth = getDaysInMonth(monthIndex);
  const plannedItems = getPlannedTransferItems();
  if (!effectiveDate || Number.isNaN(effectiveDate.getTime())) {
    throw new Error("Enter a valid effective date.");
  }
  if (!actionDate || Number.isNaN(actionDate.getTime())) {
    throw new Error("Enter a valid transaction date.");
  }
  const isMonthStart = effectiveDate.getTime() === buildMonthDate(monthIndex, 0).getTime();
  if (!isMonthStart && (effectiveDate.getMonth() !== monthIndex || effectiveDate.getFullYear() !== currentYear)) {
    throw new Error("The effective date must be within the selected month.");
  }
  if (actionDate.getMonth() !== monthIndex || actionDate.getFullYear() !== currentYear) {
    throw new Error("The transaction date must be within the selected month.");
  }
  if (actionDate.getDate() < getMinimumSelectableDay()) {
    throw new Error(`The transaction date must be between day ${getMinimumSelectableDay()} and day ${daysInMonth} for the selected month.`);
  }
  if (actionDate <= effectiveDate) {
    throw new Error("The transaction date must be later than the effective date of your current values.");
  }

  const dataDay = isMonthStart ? 0 : effectiveDate.getDate();
  if (dataDay < 0 || dataDay > daysInMonth) {
    throw new Error(`Day must be between 1 and ${daysInMonth} for the selected month.`);
  }
  const previousMonthMab = isStash ? Number(formData.get("previousMab")) : currentMab - mabIncrease;
  const bufferInput = isStash ? Number(formData.get("buffer")) : 10;
  if (![currentMab, currentBalance, previousMonthMab, goalIncrease, bufferInput].every(value => Number.isFinite(value) && value >= 0)) throw new Error("Balances, target and buffer must be valid non-negative amounts.");
  const targetMab = previousMonthMab + goalIncrease;
  const bufferAmount = bufferInput;
  const bufferedTargetMab = Math.max(targetMab + bufferAmount, isStash ? 10000.01 : 0);
  const differenceToGoal = currentMab - targetMab;
  const remainingDays = daysInMonth - dataDay;
  const totalBalanceNeeded = bufferedTargetMab * daysInMonth;
  const totalAccumulatedSoFar = currentMab * dataDay;
  const actionContributionDays = Math.max(0, daysInMonth - actionDate.getDate() + 1);

  const expectedBonus = advanced && !isStash ? Number(formData.get("expectedBonus") || 0) : 0;
  if (!Number.isFinite(expectedBonus) || expectedBonus < 0) throw new Error("Enter a valid expected bonus amount.");
  if (expectedBonus > 0) {
    const bonusDate = parseInputDate(formData.get("bonusDate"));
    if (!bonusDate || Number.isNaN(bonusDate.getTime()) || bonusDate.getFullYear() !== currentYear || bonusDate.getMonth() !== monthIndex || bonusDate <= effectiveDate) {
      throw new Error("Expected bonus posting date must be after the MAB effective date and within the selected month. Include already credited interest in your current balance instead.");
    }
    plannedItems.push({ day: bonusDate.getDate(), amount: expectedBonus, signedAmount: expectedBonus, type: "bonus" });
  }
  plannedItems.forEach((item) => {
    if (!Number.isInteger(item.day) || item.day <= dataDay || item.day > daysInMonth) {
      throw new Error(`Planned transfer days must be between ${dataDay + 1} and ${daysInMonth}.`);
    }
    if (!Number.isFinite(item.amount) || item.amount < 0) {
      throw new Error("Planned transfer amounts cannot be negative.");
    }
  });

  const plannedTransfersWithImpact = plannedItems.map((item) => {
    const activeDays = Math.max(0, daysInMonth - item.day + 1);
    return {
      ...item,
      activeDays,
      contribution: item.signedAmount * activeDays,
    };
  });

  const plannedContribution = plannedTransfersWithImpact.reduce((sum, item) => sum + item.contribution, 0);

  const baseContributionWithoutToday = currentBalance * remainingDays;
  const requiredContributionFromToday = totalBalanceNeeded - totalAccumulatedSoFar;

  let baseInterest = null;
  if (advanced) {
    const rateValue = formData.get("baseRate");
    const rate = Number(rateValue) / 100;
    const yearDays = Number(formData.get("yearDays"));
    if (rateValue === null || rateValue === "" || !Number.isFinite(rate) || rate < 0 || rate > 1 || ![365, 366].includes(yearDays)) {
      throw new Error("Enter a valid base interest rate and select a 365 or 366 day basis.");
    }
    baseInterest = { rate, yearDays };
  }
  const solveOptions = { days: daysInMonth, dataDay, actionDay: actionDate.getDate(), currentMab, currentBalance, target: bufferedTargetMab, transfers: plannedItems };
  let basicPlan;
  try {
    basicPlan = solveMabPlan({ ...solveOptions, transfers: plannedItems.filter(item => item.type !== "bonus") });
  } catch (error) {
    if (!advanced) throw error;
    // An entered bonus may fund a planned transfer before the main move.
    // A comparison without that credit must not block the advanced plan.
    basicPlan = null;
  }
  const solved = advanced ? solveMabPlan({ ...solveOptions, baseInterest }) : basicPlan;
  let trial = null;
  const trialValue = formData.get("trialWithdrawal");
  if (advanced && trialValue !== null && trialValue !== "") {
    const amount = Number(trialValue);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid trial withdrawal amount.");
    try {
      trial = { amount, ...projectMabMove({ ...solveOptions, baseInterest }, -amount) };
      trial.meetsTarget = trial.projectedMab >= bufferedTargetMab - 1e-8;
      trial.meetsRequirement = isStash
        ? trial.projectedMab >= previousMonthMab - 1e-8 && trial.projectedMab > 10000
        : trial.projectedMab >= targetMab - 1e-8 && trial.projectedMab > 0;
    } catch (error) {
      trial = { amount, error: error.message };
    }
  }
  const todayTransferAmount = solved.move;
  const cannotReachGoal = false;
  const targetBalanceToday = solved.actionBalance;
  const totalPlannedTransferAmount = plannedTransfersWithImpact.reduce((sum, item) => sum + item.signedAmount, 0);
  const projectedMonthEndBalance = solved.endBalance;

  return {
    isStash,
    advanced,
    baseInterest,
    expectedBonus,
    forecast: solved,
    basicMove: basicPlan ? basicPlan.move : null,
    trial,
    projectedMab: solved.projectedMab,
    daysInMonth,
    remainingDays,
    dataDay,
    effectiveDate,
    actionDate,
    currentMab,
    currentBalance,
    previousMonthMab,
    mabIncrease,
    goalIncrease,
    bufferAmount,
    targetMab,
    bufferedTargetMab,
    differenceToGoal,
    actionContributionDays,
    cannotReachGoal,
    plannedItems: plannedTransfersWithImpact,
    plannedContribution,
    baseContributionWithoutToday,
    requiredContributionFromToday,
    totalPlannedTransferAmount,
    todayTransferAmount,
    targetBalanceToday,
    projectedMonthEndBalance,
    totalBalanceNeeded,
    totalAccumulatedSoFar,
  };
}

function renderResults(plan) {
  let actionVerb = "Deposit";
  let amountClass = "amount-deposit";
  let actionText = `Deposit ${formatMoney(plan.todayTransferAmount)} on ${formatDisplayDate(plan.actionDate)} to stay slightly above the goal.`;
  let amountText = formatMoney(plan.todayTransferAmount);

  if (plan.cannotReachGoal) {
    actionVerb = "Final";
    amountClass = "amount-neutral";
    amountText = formatMoney(0);
    actionText = `A transfer on ${formatDisplayDate(plan.actionDate)} is too late to affect this month's goal. Choose an earlier transaction date.`;
  } else if (plan.todayTransferAmount < 0) {
    actionVerb = "Withdraw";
    amountClass = "amount-withdraw";
    amountText = formatMoney(Math.abs(plan.todayTransferAmount));
    actionText = `Withdraw ${formatMoney(Math.abs(plan.todayTransferAmount))} on ${formatDisplayDate(plan.actionDate)}.`;
  } else if (plan.todayTransferAmount === 0) {
    actionVerb = "Move";
    amountClass = "amount-neutral";
    amountText = formatMoney(0);
    actionText = `No additional transfer is needed on ${formatDisplayDate(plan.actionDate)} if your planned transfers still happen.`;
  } else {
    actionText = `Deposit ${formatMoney(plan.todayTransferAmount)} on ${formatDisplayDate(plan.actionDate)}.`;
  }

  const grid = createElement("div", { className: "results-grid" });
  const primaryResult = createElement("article", { className: "primary-result" });
  primaryResult.append(
    createElement("strong", { text: plan.todayTransferAmount < 0 ? "Recommended maximum withdrawal with buffer" : `Recommended ${actionVerb.toLowerCase()} amount` }),
    createElement("span", { className: `primary-amount ${amountClass}`, text: amountText }),
    createElement("p", { className: "result-caption", text: actionText }),
  );

  const actions = createElement("div", { className: "result-actions" });
  const showDetailsButton = createElement("button", {
    className: "details-button",
    type: "button",
    text: "Show calculation details",
  });
  showDetailsButton.id = "showDetailsButton";
  actions.append(showDetailsButton);

  const summary = createElement("details", { className: "summary result-notes" });
  const plannedSummary = plan.plannedItems.length > 0
    ? `Future transfers included: ${plan.plannedItems.map((item) => `${item.signedAmount >= 0 ? "credit" : "withdraw"} ${formatMoney(item.amount)} on day ${item.day}`).join(", ")}.`
    : "No planned transfers were included in this calculation.";
  summary.append(
    createElement("summary", { text: "Notes and assumptions" }),
    createElement("p", { text: `This uses values effective on ${formatDisplayDate(plan.effectiveDate)}.` }),
    createElement("p", { text: plannedSummary }),
    createElement("p", { className: "note", text: `Chosen transaction date: ${formatDisplayDate(plan.actionDate)}.` }),
  );

  summary.append(createElement("p", { text: `Recommended plan MAB: ${formatMoney(plan.projectedMab)}. Target including buffer: ${formatMoney(plan.bufferedTargetMab)}.` }));
  if (plan.isStash) {
    summary.append(createElement("p", { text: `Previous month MAB: ${formatMoney(plan.previousMonthMab)}. Projected closing balance: ${formatMoney(plan.projectedMonthEndBalance)}.` }));
    summary.append(createElement("p", { text: "The limit applies to this month and the transfers entered. A lower closing balance may require a top-up next month to maintain this month’s MAB. Special promotions and earmarked funds are excluded." }));
  }
  grid.append(primaryResult);
  if (plan.advanced) {
    const selectedForecast = plan.trial && !plan.trial.error ? plan.trial : plan.forecast;
    const scenarioHeading = createElement("div", { className: "forecast-heading" });
    scenarioHeading.append(
      createElement("strong", { text: plan.trial && !plan.trial.error ? `Forecast after your ${formatMoney(plan.trial.amount)} withdrawal` : "Forecast after the recommended move" }),
      createElement("p", { text: `On ${formatDisplayDate(plan.actionDate)}, using MAB known through ${formatDisplayDate(plan.effectiveDate)}.` }),
    );
    grid.append(scenarioHeading);
    const forecastGrid = createElement("div", { className: "forecast-grid" });
    for (const [label, value] of [
      ["Predicted full-month base interest", selectedForecast.estimatedBaseInterest],
      ["Balance after withdrawal / move", selectedForecast.actionBalance],
      ["Expected MAB before base credit", selectedForecast.mabBeforeInterest],
      ["Expected MAB after base credit", selectedForecast.projectedMab],
      ["Expected closing balance", selectedForecast.endBalance],
      ["Target MAB including buffer", plan.bufferedTargetMab],
    ]) {
      const metric = createElement("article", { className: "metric" });
      metric.append(createElement("strong", { text: label }), createElement("span", { text: formatMoney(value) }));
      forecastGrid.append(metric);
    }
    grid.append(forecastGrid);
    summary.append(createElement("p", { text: `Base interest is estimated at ${(plan.baseInterest.rate * 100).toFixed(3)}% p.a. using ${plan.baseInterest.yearDays} days. The credit affects only the final day's MAB; it cannot fund an earlier withdrawal. The recommended move retains your S$${plan.bufferAmount.toFixed(2)} MAB buffer.` }));
    summary.append(createElement("p", { text: plan.basicMove === null ? "Simple mode cannot fund the entered planned transfers before the transaction date without the pending bonus." : `Simple mode would recommend a signed move of ${formatMoney(plan.basicMove)} without forecast interest credits.` }));
    if (plan.expectedBonus > 0) summary.append(createElement("p", { text: `Includes an entered future OCBC bonus credit of ${formatMoney(plan.expectedBonus)}. This is last month's expected bonus, not a prediction of earnings from your withdrawal. Its posting date and amount are assumptions.` }));
    if (plan.trial) {
      const trial = createElement("article", { className: "summary" });
      trial.append(createElement("strong", { text: `If you withdraw ${formatMoney(plan.trial.amount)}` }));
      if (plan.trial.error) {
        trial.append(createElement("p", { text: plan.trial.error }));
      } else {
        trial.append(
          createElement("p", { text: plan.trial.meetsTarget ? "Meets the balance target and selected buffer." : plan.trial.meetsRequirement ? "Meets the bank's balance requirement but falls below your selected buffer." : plan.isStash ? "Falls below the Stash bonus-interest balance requirement." : "Falls below the OCBC Save balance-increase requirement." }),
        );
      }
      grid.append(trial);
    }
  }
  if (!plan.advanced) {
    const simpleMetrics = createElement("div", { className: "forecast-grid" });
    for (const [label, value] of [["Projected month-end MAB", plan.projectedMab], ["Target MAB including buffer", plan.bufferedTargetMab]]) {
      const metric = createElement("article", { className: "metric" });
      metric.append(createElement("strong", { text: label }), createElement("span", { text: formatMoney(value) }));
      simpleMetrics.append(metric);
    }
    grid.append(simpleMetrics);
  }
  grid.append(actions, summary);
  results.replaceChildren(grid);

  showDetailsButton.addEventListener("click", () => {
    renderMathBreakdown(plan);
    openMathModal();
  });
}

function renderMathBreakdown(plan) {
  const actionFormula = plan.advanced
    ? `Find the smallest cent-rounded move for which (balance-days + floor-to-cents(balance-days × ${plan.baseInterest.rate} / ${plan.baseInterest.yearDays})) / ${plan.daysInMonth} ≥ ${formatMoney(plan.bufferedTargetMab)}. Recommended move: ${formatMoney(plan.todayTransferAmount)}.`
    : plan.actionContributionDays > 0
    ? `(${formatMoney(plan.requiredContributionFromToday)} - ${formatMoney(plan.baseContributionWithoutToday)} - ${formatMoney(plan.plannedContribution)}) / ${plan.actionContributionDays} `
      + `; recommended move after conservative cent rounding and available-funds limits: ${formatMoney(plan.todayTransferAmount)}`
    : "No further in-month contribution is possible because the chosen transaction date is too late.";
  clearElement(mathBreakdown);

  function appendStep(title, codeText, paragraphText, listItems = []) {
    const step = createElement("article", { className: "math-step" });
    step.append(
      createElement("strong", { text: title }),
      createElement("pre", { text: codeText }),
    );

    if (paragraphText) {
      step.append(createElement("p", { text: paragraphText }));
    }

    if (listItems.length > 0) {
      const list = createElement("ul");
      listItems.forEach((itemText) => {
        list.append(createElement("li", { text: itemText }));
      });
      step.append(list);
    }

    mathBreakdown.append(step);
  }

  appendStep(
    "1. Previous month MAB",
    plan.isStash ? `Entered previous MAB: ${formatMoney(plan.previousMonthMab)}` : `${formatMoney(plan.currentMab)} - ${formatMoney(plan.mabIncrease)} = ${formatMoney(plan.previousMonthMab)}`,
  );
  appendStep(
    "2. Target MAB",
    `${formatMoney(plan.previousMonthMab)} + ${formatMoney(plan.goalIncrease)} = ${formatMoney(plan.targetMab)}`,
  );
  appendStep(
    "3. Planned MAB with small buffer",
    `${formatMoney(plan.targetMab)} + ${formatMoney(plan.bufferAmount)}; final target = ${formatMoney(plan.bufferedTargetMab)}`,
    plan.isStash ? "The final target must also exceed S$10,000 to earn bonus interest." : "",
  );
  appendStep(
    "4. Balance needed across the full month",
    `${formatMoney(plan.bufferedTargetMab)} x ${plan.daysInMonth} days = ${formatMoney(plan.totalBalanceNeeded)}`,
  );
  appendStep(
    "5. Balance already accumulated through the effective date",
    `${formatMoney(plan.currentMab)} x ${plan.dataDay} days = ${formatMoney(plan.totalAccumulatedSoFar)}`,
  );
  appendStep(
    "6. Base contribution from keeping the current balance unchanged",
    `${formatMoney(plan.currentBalance)} x ${plan.remainingDays} days = ${formatMoney(plan.baseContributionWithoutToday)}`,
  );
  appendStep(
    "7. Contribution from planned transfers",
    `${formatMoney(plan.plannedContribution)}`,
    plan.plannedItems.length === 0 ? "No planned transfers were added." : "",
    plan.plannedItems.map((item) => `${item.signedAmount >= 0 ? "Credit" : "Withdrawal"} ${formatMoney(item.amount)} on day ${item.day} affects ${item.activeDays} day(s).`),
  );
  appendStep(
    "8. Additional amount needed from the effective date onward",
    `${formatMoney(plan.totalBalanceNeeded)} - ${formatMoney(plan.totalAccumulatedSoFar)} = ${formatMoney(plan.requiredContributionFromToday)}`,
  );
  appendStep(
    "9. Amount to move on the chosen transaction date",
    actionFormula,
    plan.todayTransferAmount > 0
      ? `Deposit ${formatMoney(plan.todayTransferAmount)} on ${formatDisplayDate(plan.actionDate)}.`
      : plan.todayTransferAmount < 0
        ? `Withdraw ${formatMoney(Math.abs(plan.todayTransferAmount))} on ${formatDisplayDate(plan.actionDate)}.`
        : "No transfer is needed.",
  );
  appendStep(
    "10. Target balance after the chosen action",
    `${formatMoney(plan.targetBalanceToday)}`,
    `Transaction date: ${formatDisplayDate(plan.actionDate)}.`,
  );
  if (plan.advanced) {
    appendStep(
      "11. Base interest earned across the full month",
      `${formatMoney(plan.forecast.balanceDays)} balance-days × ${plan.baseInterest.rate} / ${plan.baseInterest.yearDays} = ${formatMoney(plan.forecast.estimatedBaseInterest)} (rounded down to cents)`,
      "Includes historical balances already represented by current MAB and each projected day after the effective date. No interest is earned on this forecast credit before it posts.",
    );
    appendStep(
      "12. MAB after the final-day credit",
      `(${formatMoney(plan.forecast.balanceDays)} + ${formatMoney(plan.forecast.estimatedBaseInterest)}) / ${plan.daysInMonth} = ${formatMoney(plan.projectedMab)}`,
      `MAB rises by ${(plan.forecast.estimatedBaseInterest / plan.daysInMonth).toFixed(4)} SGD because the credit counts for one day.`,
    );
    if (plan.trial && !plan.trial.error) {
      appendStep(
        "13. Custom withdrawal forecast (replaces the recommended move)",
        `Withdraw ${formatMoney(plan.trial.amount)}: (${formatMoney(plan.trial.balanceDays)} balance-days + ${formatMoney(plan.trial.estimatedBaseInterest)} base credit) / ${plan.daysInMonth} = ${formatMoney(plan.trial.projectedMab)}`,
        `Closing balance: ${formatMoney(plan.trial.endBalance)}. Uses the same historical MAB and dated transfers as the recommendation.`,
      );
    }
  }
}

function openMathModal() {
  mathModal.classList.remove("hidden");
  mathModal.setAttribute("aria-hidden", "false");
}

function closeMathModal() {
  mathModal.classList.add("hidden");
  mathModal.setAttribute("aria-hidden", "true");
}

populateMonths();
syncDates();
renderEmptyTransfers();

monthSelect.addEventListener("change", syncDates);
useOlderMabInput.addEventListener("change", () => {
  document.querySelector("#effectiveDateLabel").classList.toggle("hidden", !useOlderMabInput.checked);
  syncDates();
  syncMabInput();
  syncAdvanced();
});
effectiveDateInput.addEventListener("change", () => {
  const effectiveDate = parseInputDate(effectiveDateInput.value);
  if (effectiveDate && effectiveDate.getTime() !== buildMonthDate(Number(monthSelect.value), 0).getTime()) {
    monthSelect.value = String(effectiveDate.getMonth());
  }
  syncDates();
});
actionDateInput.addEventListener("change", () => {
  syncAllTransferRows();
});
addTransferButton.addEventListener("click", createTransferRow);
plannedTransfers.addEventListener("click", (event) => {
  if (event.target.classList.contains("remove-transfer")) {
    event.target.closest(".planned-transfer-row").remove();
    renderEmptyTransfers();
  }
});
closeModalButton.addEventListener("click", closeMathModal);
mathModal.addEventListener("click", (event) => {
  if (event.target.dataset.closeModal === "true") {
    closeMathModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !mathModal.classList.contains("hidden")) {
    closeMathModal();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const formData = new FormData(form);
    const plan = calculatePlan(formData);
    renderResults(plan);
    closeMathModal();
  } catch (error) {
    closeMathModal();
    results.replaceChildren(createElement("div", { className: "placeholder", text: error.message }));
  }
});

const accountSelect = document.querySelector("#account");
function syncAccount() {
  const stash = accountSelect.value === "uob-stash";
  // Each account opens in simple mode; forecasting always requires opting in.
  document.querySelector("#advancedMode").checked = false;
  document.querySelector("#advancedTitle").textContent = stash
    ? "Advanced: interest and withdrawal forecast"
    : "Advanced (OCBC trial): interest and withdrawal forecast";
  syncAdvanced();
  for (const id of ["previousLabel", "bufferLabel"]) document.querySelector("#" + id).classList.toggle("hidden", !stash);
  for (const id of ["increaseLabel", "goalLabel"]) document.querySelector("#" + id).classList.toggle("hidden", stash);
  document.querySelector("h1").textContent = stash ? "UOB Stash withdrawal calculator" : "MAB goal calculator";
  document.querySelector(".intro").textContent = stash ? "Calculate how much you can withdraw while maintaining last month’s MAB." : "Estimate how much to deposit or withdraw to finish above your OCBC Save MAB increase target (S$500 by default).";
  if (stash) {
    for (const id of ["currentBalance", "currentMab"]) {
      const input = document.querySelector("#" + id);
      if (!input.value || Number(input.value) === 0) input.value = "50000";
    }
    setStashDates();
  }
  else syncMabInput();
  results.replaceChildren(createElement("div", { className: "placeholder", text: "Enter your account values and calculate a plan." }));
  closeMathModal();
}
accountSelect.value = new URLSearchParams(window.location.search).get("account") === "uob-stash" ? "uob-stash" : "ocbc";
syncAccount();
accountSelect.addEventListener("change", () => {
  const url = new URL(window.location.href);
  url.searchParams.set("account", accountSelect.value);
  window.history.replaceState(null, "", url);
  syncAccount();
});
monthSelect.addEventListener("change", () => {
  syncMabInput();
});
effectiveDateInput.addEventListener("change", syncMabInput);
effectiveDateInput.addEventListener("change", syncAdvanced);
monthSelect.addEventListener("change", syncAdvanced);

function setStashDates() {
  const month = Number(monthSelect.value);
  const calculationDate = month === currentMonthIndex ? now : buildMonthDate(month, 1);
  if (!useOlderMabInput.checked) effectiveDateInput.value = formatDateForInput(addDays(calculationDate, -1));
  actionDateInput.value = formatDateForInput(calculationDate);
  syncDates();
  syncMabInput();
}

function syncMabInput() {
  const stash = document.querySelector("#account").value === "uob-stash";
  const atStart = effectiveDateInput.value === formatDateForInput(buildMonthDate(Number(monthSelect.value), 0));
  const hideCurrent = stash && atStart;
  document.querySelector("#currentMabLabel").classList.toggle("hidden", hideCurrent);
  document.querySelector("#currentMab").required = !hideCurrent;
  document.querySelector("#currentMabLabel span").textContent = useOlderMabInput.checked
    ? "Current MAB (through chosen date)"
    : Number(monthSelect.value) === currentMonthIndex ? "Current MAB (as of yesterday)" : "Current MAB (through effective date)";
  if (hideCurrent) document.querySelector("#currentMab").value = "0";
}

function syncAdvanced() {
  const enabled = document.querySelector("#advancedMode").checked;
  const ocbc = document.querySelector("#account").value === "ocbc";
  document.querySelector("#advancedPanel").classList.toggle("hidden", !enabled);
  for (const id of ["baseRate", "yearDays", "trialWithdrawal"]) document.querySelector("#" + id).disabled = !enabled;
  for (const id of ["bonusAmountLabel", "bonusDateLabel"]) document.querySelector("#" + id).classList.toggle("hidden", !ocbc);
  for (const id of ["expectedBonus", "bonusDate"]) document.querySelector("#" + id).disabled = !enabled || !ocbc;
  const bonusDate = document.querySelector("#bonusDate");
  const effectiveDate = parseInputDate(effectiveDateInput.value);
  if (effectiveDate) bonusDate.min = formatDateForInput(addDays(effectiveDate, 1));
  bonusDate.max = formatDateForInput(buildMonthDate(Number(monthSelect.value), getSelectedDaysInMonth()));
}

document.querySelector("#advancedMode").addEventListener("change", () => {
  syncAdvanced();
  results.replaceChildren(createElement("div", { className: "placeholder", text: "Calculate again to apply the selected interest mode." }));
  closeMathModal();
});
