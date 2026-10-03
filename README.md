# MAB Goal Calculator

The application version is maintained in [VERSION](./VERSION). Completed checkpoints are committed locally, with version increments for application changes.

This is a small browser-based calculator for estimating how much to deposit or withdraw so your Monthly Average Balance (MAB) ends the month slightly above your target increase.

## UOB Stash mode

Choose **UOB Stash (Singapore)** in the account selector, or open the same app with `?account=uob-stash` (for example `index.html?account=uob-stash`). OCBC remains the default.

Stash uses the previous month’s MAB directly. It requires this month’s MAB to be at least the previous month’s, and above S$10,000 for bonus interest. The bonus-interest cap of S$100,000 does not cap the balance used for the month-to-month comparison. Stash starts with a S$50,000 previous-month MAB and balance. The editable MAB buffer defaults to S$1 above the previous month MAB, subject to conservative cent rounding.

Stash defaults to calculating today using MAB known through yesterday. For a different selected month it starts on day 1. On day 1, the effective date is the previous month’s final day. Enter that completed month’s MAB in “Previous month’s MAB”; the current-month MAB input is hidden because no days have accumulated yet. For later withdrawals, change the effective and transaction dates and enter the current MAB through that effective date.

There is no separate interest field. Base interest (0.05% p.a.) is credited on the last day of the month; the remaining bonus interest is credited at the beginning of the following month. Last month’s interest already credited is included in the current balance, and any credit reflected in the completed month is already included in that month’s MAB. Uncredited interest is not assumed; if needed, add it as a planned deposit on its actual posting day.

The recommendation rounds withdrawals down and deposits up to cents and reserves money for planned withdrawals. It is conditional on the dated transfers entered, assumes no other balance changes, and concerns the selected month only. A reduced closing balance can require a top-up next month. Promotional or earmarked-fund conditions are outside scope. It does not estimate future interest automatically or promise a particular interest payout.

Rules verified on 2 October 2026 against [UOB Stash](https://www.uob.com.sg/personal/save/savings-accounts/stash-account.page) and [UOB account terms](https://www.uob.com.sg/web-resources/personal/pdf/personal/save/tnc-cts.pdf), section 41.

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
- The app is fully client-side and does not store or send your data anywhere.

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
