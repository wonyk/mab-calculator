# MAB Goal Calculator

This is a small browser-based calculator for estimating how much to deposit or withdraw so your Monthly Average Balance (MAB) ends the month slightly above your target increase.

## What It Does

The calculator asks for:

- the month
- the effective date of your current values
- your current MAB as of that effective date
- the MAB increase compared to the previous month
- your current account balance
- your target increase, which defaults to `500`
- the date you plan to perform the deposit or withdrawal
- any planned deposits or withdrawals from today through the end of the month

Using those inputs, it:

- estimates the previous month's MAB
- calculates the target MAB for the current month
- adds a small buffer above the target
- works out one main amount to deposit or withdraw on your chosen transaction date
- factors in any planned transfers you already expect from today through the end of the month
- warns you if the chosen transaction date is too late to affect the goal
- can optionally show a detailed math breakdown when you click `Show calculation details`

## Assumptions

- The current MAB is accurate through the effective date you provide.
- `Previous month MAB = current MAB - MAB increase vs previous month`.
- The target is the previous month's MAB plus the target increase.
- The app currently treats "a little over" the goal as `target + 10`.
- The main recommendation is based on the transaction date you choose.
- Any planned transfers are assumed to happen on the exact days you enter.
- The chosen transaction date for the main move is separate from planned transfers, but it cannot be earlier than the effective date.

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
