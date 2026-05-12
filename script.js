const monthSelect = document.querySelector("#month");
const effectiveDateInput = document.querySelector("#effectiveDate");
const actionDateInput = document.querySelector("#actionDate");
const form = document.querySelector("#mab-form");
const results = document.querySelector("#results");
const addTransferButton = document.querySelector("#addTransferButton");
const plannedTransfers = document.querySelector("#plannedTransfers");
const mathModal = document.querySelector("#mathModal");
const closeModalButton = document.querySelector("#closeModalButton");
const mathBreakdown = document.querySelector("#mathBreakdown");

const now = new Date();
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
  return selectedMonth === currentMonthIndex ? currentDay : 1;
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
    const emptyText = minimumDay >= getSelectedDaysInMonth()
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
  const minFutureDay = Math.min(daysInMonth, getMinimumSelectableDay());

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
  const defaultDate = yesterday.getMonth() === selectedMonth
    ? yesterday
    : buildMonthDate(selectedMonth, daysInMonth);
  const nextDate = currentEffectiveDate || defaultDate;
  const clampedDay = Math.min(nextDate.getDate(), daysInMonth);
  const syncedDate = buildMonthDate(selectedMonth, clampedDay);
  const defaultActionDate = buildMonthDate(selectedMonth, Math.min(daysInMonth, getMinimumSelectableDay()));
  const nextActionDate = currentActionDate || defaultActionDate;
  const actionDay = Math.max(getMinimumSelectableDay(), Math.min(nextActionDate.getDate(), daysInMonth));
  const syncedActionDate = buildMonthDate(selectedMonth, actionDay);

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
  const goalIncrease = Number(formData.get("goalIncrease") || 500);
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
  if (effectiveDate.getMonth() !== monthIndex || effectiveDate.getFullYear() !== currentYear) {
    throw new Error("The effective date must be within the selected month.");
  }
  if (actionDate.getMonth() !== monthIndex || actionDate.getFullYear() !== currentYear) {
    throw new Error("The transaction date must be within the selected month.");
  }
  if (actionDate.getDate() < getMinimumSelectableDay()) {
    throw new Error(`The transaction date must be between day ${getMinimumSelectableDay()} and day ${daysInMonth} for the selected month.`);
  }
  if (actionDate < effectiveDate) {
    throw new Error("The transaction date cannot be earlier than the effective date of your current values.");
  }

  const dataDay = effectiveDate.getDate();
  if (dataDay < 1 || dataDay > daysInMonth) {
    throw new Error(`Day must be between 1 and ${daysInMonth} for the selected month.`);
  }
  const previousMonthMab = currentMab - mabIncrease;
  const targetMab = previousMonthMab + goalIncrease;
  const bufferAmount = 10;
  const bufferedTargetMab = targetMab + bufferAmount;
  const differenceToGoal = currentMab - targetMab;
  const remainingDays = daysInMonth - dataDay;
  const totalBalanceNeeded = bufferedTargetMab * daysInMonth;
  const totalAccumulatedSoFar = currentMab * dataDay;
  const actionContributionDays = Math.max(0, daysInMonth - actionDate.getDate() + 1);

  plannedItems.forEach((item) => {
    if (item.day < getMinimumSelectableDay() || item.day > daysInMonth) {
      throw new Error(`Planned transfer days must be between ${getMinimumSelectableDay()} and ${daysInMonth}.`);
    }
    if (item.amount < 0) {
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

  let todayTransferAmount = 0;
  let cannotReachGoal = false;
  if (actionContributionDays > 0) {
    todayTransferAmount = (requiredContributionFromToday - baseContributionWithoutToday - plannedContribution) / actionContributionDays;
  } else {
    cannotReachGoal = true;
  }
  todayTransferAmount = Math.max(-currentBalance, todayTransferAmount);
  const targetBalanceToday = Math.max(0, currentBalance + todayTransferAmount);
  const totalPlannedTransferAmount = plannedTransfersWithImpact.reduce((sum, item) => sum + item.signedAmount, 0);
  const projectedMonthEndBalance = targetBalanceToday + totalPlannedTransferAmount;

  return {
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
    createElement("strong", { text: `${actionVerb} amount` }),
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

  const summary = createElement("article", { className: "summary" });
  const plannedSummary = plan.plannedItems.length > 0
    ? `Future transfers included: ${plan.plannedItems.map((item) => `${item.type === "deposit" ? "deposit" : "withdraw"} ${formatMoney(item.amount)} on day ${item.day}`).join(", ")}.`
    : "No planned transfers were included in this calculation.";
  summary.append(
    createElement("strong", { text: "Notes" }),
    createElement("p", { text: `This uses values effective on ${formatDisplayDate(plan.effectiveDate)}.` }),
    createElement("p", { text: plannedSummary }),
    createElement("p", { className: "note", text: `Chosen transaction date: ${formatDisplayDate(plan.actionDate)}.` }),
  );

  grid.append(primaryResult, actions, summary);
  results.replaceChildren(grid);

  showDetailsButton.addEventListener("click", () => {
    renderMathBreakdown(plan);
    openMathModal();
  });
}

function renderMathBreakdown(plan) {
  const actionFormula = plan.actionContributionDays > 0
    ? `(${formatMoney(plan.requiredContributionFromToday)} - ${formatMoney(plan.baseContributionWithoutToday)} - ${formatMoney(plan.plannedContribution)}) / ${plan.actionContributionDays} = ${formatMoney(plan.todayTransferAmount)}`
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
    `${formatMoney(plan.currentMab)} - ${formatMoney(plan.mabIncrease)} = ${formatMoney(plan.previousMonthMab)}`,
  );
  appendStep(
    "2. Target MAB",
    `${formatMoney(plan.previousMonthMab)} + ${formatMoney(plan.goalIncrease)} = ${formatMoney(plan.targetMab)}`,
  );
  appendStep(
    "3. Planned MAB with small buffer",
    `${formatMoney(plan.targetMab)} + ${formatMoney(plan.bufferAmount)} = ${formatMoney(plan.bufferedTargetMab)}`,
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
    plan.plannedItems.map((item) => `${item.type === "deposit" ? "Deposit" : "Withdrawal"} ${formatMoney(item.amount)} on day ${item.day} affects ${item.activeDays} day(s).`),
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
    `${formatMoney(plan.currentBalance)} + ${formatMoney(plan.todayTransferAmount)} = ${formatMoney(plan.targetBalanceToday)}`,
    `Transaction date: ${formatDisplayDate(plan.actionDate)}.`,
  );
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
effectiveDateInput.addEventListener("change", () => {
  const effectiveDate = parseInputDate(effectiveDateInput.value);
  if (effectiveDate) {
    monthSelect.value = String(effectiveDate.getMonth());
  }
  syncDates();
});
actionDateInput.addEventListener("change", () => {
  const actionDate = parseInputDate(actionDateInput.value);
  if (actionDate) {
    monthSelect.value = String(actionDate.getMonth());
  }
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
