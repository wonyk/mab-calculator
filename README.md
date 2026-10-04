# MAB Goal Calculator

The application version is maintained in [VERSION](./VERSION). Completed checkpoints are committed locally, with version increments for application changes.

The page footer shows the version. Styles and scripts use matching version URLs to refresh cached assets when a new version is published.

Results lead with the maximum withdrawal or required deposit and the balance to retain immediately after the move. Custom withdrawal forecasts show whether the bank's balance requirement and the selected buffer are met. The predicted interest card also shows the final-day credit's contribution to MAB.

The date summary always shows the known MAB date and the proposed transaction date. Account figures and target/buffer settings are remembered separately for OCBC and UOB in this browser's local storage. A last-edited time helps identify old figures; review them against the refreshed dates before calculating. Reloading restores today's transaction date and yesterday's MAB date and opens simple mode. Custom withdrawals, pending bonus credits, older-date overrides and planned transfers are not saved. **Clear saved values** clears only the selected account and restores its defaults. The calculator continues working if local storage is unavailable.

This is a small browser-based calculator for estimating how much to deposit or withdraw so your Monthly Average Balance (MAB) ends the month slightly above your target increase.

## UOB Stash mode

Choose **UOB Stash (Singapore)** in the account selector, or open the same app with `?account=uob-stash` (for example `index.html?account=uob-stash`). OCBC remains the default.

Stash uses the previous month’s MAB directly. It requires this month’s MAB to be at least the previous month’s, and above S$10,000 for bonus interest. The bonus-interest cap of S$100,000 does not cap the balance used for the month-to-month comparison. Stash starts with a S$50,000 previous-month MAB and balance. The editable MAB buffer defaults to S$1 above the previous month MAB, subject to conservative cent rounding.

Stash defaults to calculating today using MAB known through yesterday. For a different selected month it starts on day 1. On day 1, the effective date is the previous month’s final day. Enter that completed month’s MAB in “Previous month’s MAB”; the current-month MAB input is hidden because no days have accumulated yet. For later withdrawals, change the effective and transaction dates and enter the current MAB through that effective date.

There is no separate interest field. Base interest (0.05% p.a.) is credited on the last day of the month; the remaining bonus interest is credited at the beginning of the following month. Last month’s interest already credited is included in the current balance, and any credit reflected in the completed month is already included in that month’s MAB. Uncredited interest is not assumed; if needed, add it as a planned deposit on its actual posting day.

The recommendation rounds withdrawals down and deposits up to cents and reserves money for planned withdrawals. It is conditional on the dated transfers entered, assumes no other balance changes, and concerns the selected month only. A reduced closing balance can require a top-up next month. Promotional or earmarked-fund conditions are outside scope. Basic mode excludes uncredited interest; advanced mode provides a forecast rather than a guaranteed bank payout.

Rules verified on 2 October 2026 against [UOB Stash](https://www.uob.com.sg/personal/save/savings-accounts/stash-account.page) and [UOB account terms](https://www.uob.com.sg/web-resources/personal/pdf/personal/save/tnc-cts.pdf), section 41.

## Advanced interest and withdrawal projections

Both accounts open in simple mode, including after switching accounts. Select **Advanced: interest and withdrawal forecast** for Stash or **Advanced (OCBC trial): interest and withdrawal forecast** for OCBC. The default base rate is 0.05% p.a.; the day-count basis defaults to 365 and can be changed to 366. The rate and month-end accrual timing were rechecked against UOB's product page and account terms on 4 October 2026. The public UOB sources do not specify the denominator or rounding method, so these are explicit estimation assumptions.

The forecast includes the entire selected month's daily balance-days: historical MAB multiplied by completed days, then future balances after the recommended move and each planned transfer. It calculates base interest on those balances before the forecast credit, rounds the credit down to cents, and adds it only to the final day's closing balance. The day-1 bonus is already part of the current balance entered by the user and is not forecast separately. Do not also enter the forecast base credit as a planned deposit.

For balance-days `S`, annual base rate `r`, year-day basis `Y` and calendar days `D`, the model uses:

```text
Base interest = floor(S × r / Y × 100) / 100
Month-end MAB = (S + base interest) / D
```

Since the withdrawal changes `S` and therefore interest, the solver finds the minimum deposit or maximum withdrawal at cent precision that preserves the target MAB and buffer after the rounded credit. It also checks that forecast interest cannot finance the withdrawal or earlier planned outflows. Simple mode does not forecast future interest.

An optional custom withdrawal replaces the recommended move for the forecast; it is not added on top. Results explicitly show which move is being forecast, the balance after it, full-month base interest (including interest already accrued on historical balances), MAB before and after the final-day credit, and closing balance. The recommended move stays visible separately. Custom scenarios distinguish meeting the bank's balance requirement from keeping the selected buffer. The estimate assumes base interest posts on the last day and counts toward that day's MAB; posting and rounding differences can change the actual result. Forecast help, transfer guidance, and result notes are collapsed by default and can be expanded.

In the OCBC trial, the target remains the previous month's MAB plus the chosen increase (S$500 by default), with the existing S$10 buffer. You may enter last month's bonus still awaiting credit and its expected posting date within the selected month. It is treated as a future deposit from that date, rather than predicted earnings caused by the custom withdrawal. Do not enter already credited bonus interest here or duplicate it as a planned transfer. Basic mode ignores these optional inputs; Stash hides and disables them. OCBC base interest is truncated to two decimals under clause 2.1 of the [OCBC account terms](https://www.ocbc.com/iwov-resources/sg/ocbc/personal/pdf/accounts/tnc-governing-ocbc-360-account.pdf), verified on 4 October 2026. The OCBC trial models the balance requirement only; it does not determine eligibility for other bonus categories.

Example: a 31-day month starting with S$50,100 and last month's MAB of S$50,000, a S$1 buffer and no planned transfers. Basic mode recommends withdrawing S$99.00 on day 1. Advanced mode predicts S$2.12 base interest and permits S$99.06, leaving S$50,000.94 before the credit and a projected MAB of approximately S$50,001.0084 after it.

## Validation

The MAB date is automatic by default: yesterday for the current month, or the preceding month’s final day when planning another month. Select **Use older MAB data** to reveal and override the date for an older screenshot or historical calculation. Turning it off restores the automatic date while preserving the withdrawal date. A future withdrawal never changes the date of the known MAB.

Run `node calculator.test.cjs` for financial edge cases including cent rounding, month lengths, month-end credits, first-day calculations, and liquidity limits.

## What It Does

The calculator asks for:

- the month
- the effective date of your current values
- your current MAB as of that effective date
- the MAB increase compared to the previous month
- your current account balance
- your target increase, which defaults to `500`
- the date you plan to perform the deposit or withdrawal
- any planned deposits or withdrawals after the effective date through the end of the month

Using those inputs, it:

- estimates the previous month's MAB
- calculates the target MAB for the current month
- adds a small buffer above the target
- works out one main amount to deposit or withdraw on your chosen transaction date
- factors in any planned transfers you already expect after the effective date through the end of the month
- warns you if the chosen transaction date is too late to affect the goal
- can optionally show a detailed math breakdown when you click `Show calculation details`

## Assumptions

- The current MAB is accurate through the effective date you provide.
- `Previous month MAB = current MAB - MAB increase vs previous month`.
- The target is the previous month's MAB plus the target increase.
- OCBC uses a S$10 MAB buffer; Stash uses the editable buffer and S$10,000 bonus threshold.
- The main recommendation is based on the transaction date you choose.
- Any planned transfers are assumed to happen on the exact days you enter.
- The chosen transaction date for the main move is separate from planned transfers, and it must be later than the effective date.

## Files

- [index.html](./index.html) contains the page structure
- [styles.css](./styles.css) contains the styling
- [script.js](./script.js) contains the calculator logic

## How To Run

Because this is a plain HTML/CSS/JavaScript app, you can run it in either of these simple ways:

### Option 1: Open directly

Open [index.html](./index.html) in a web browser.

### Option 2: Run a local server

If you prefer serving it locally, from the project folder run:

```powershell
py -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

## Notes

- The transaction date must be later than the effective date.
- Planned transfers can be scheduled on any date from today through the end of the selected month.
- If the chosen transaction date is too late in the month, the calculator will tell you that the goal can no longer be reached from that timing.
- The app is fully client-side. Saved account figures stay in this browser on this device and are not sent to a server.

## GitHub Pages Hosting

This project can be hosted directly on GitHub Pages because it is a plain static HTML/CSS/JavaScript site.

To publish it:

1. Push this project to a GitHub repository.
2. In GitHub, open `Settings` for the repository.
3. Go to `Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select the branch you want to publish, usually `main`.
6. Select the root folder `/`.
7. Save the settings.

After GitHub finishes deploying, your site will be available at:

```text
https://<your-github-username>.github.io/<your-repository-name>/
```

No build step is required.

## Important Note

This is an experimental site vibe-coded using Codex.
