# JobPortal — Job Registration Portal

A mobile-first, config-driven job registration portal. Visitors enter a job
code, view job details, fill a dynamic registration form, pay the
registration fee, then send their registration via WhatsApp or download a
PDF receipt.

**You never edit `index.html`, CSS, or JavaScript to add, change, or remove
a job.** Everything job-related lives in `jobs.json`. Site-wide text and
branding live in `config.json`.

---

## Project structure

```
index.html              ← page shell (do not edit for job changes)
config.json              ← site branding & all on-screen text
jobs.json                ← one object per job — THIS is what you edit
assets/
  css/style.css          ← styling (do not edit for job changes)
  js/app.js              ← logic (do not edit for job changes)
  images/                ← optional images
README.md
```

---

## How to add a new job

Open `jobs.json` and append a new object to the array:

```json
{
  "id": "DATA002",
  "jobTitle": "Data Entry Specialist",
  "company": "Example Recruitment Service",
  "website": "https://example.com",
  "description": "Short description of the job.",
  "requirements": [
    "Requirement 1",
    "Requirement 2"
  ],
  "registrationFee": "5 USD",
  "paymentProvider": "Payoneer",
  "paymentLink": "https://payoneer.com/YOUR_LINK",
  "whatsapp": "923125540048",
  "telegram": "https://t.me/example",
  "email": "support@example.com",
  "formFields": [
    { "id": "fullName", "label": "Full Name", "type": "text", "required": true, "placeholder": "Your full name" },
    { "id": "country",  "label": "Country",   "type": "text", "required": true }
  ]
}
```

Rules:
- `id` is the **Job Code** applicants type on the home page. Keep it unique.
- Don't forget the comma between job objects in the array.
- Save the file — that's it. No other file needs to change.

### Supported `formFields` types

| type       | Renders as                 | Notes                              |
|------------|-----------------------------|-------------------------------------|
| `text`     | single-line text input      |                                      |
| `email`    | email input                 | browser validates email format      |
| `tel`      | phone input                 |                                      |
| `number`   | number input                |                                      |
| `textarea` | multi-line text area        |                                      |
| `select`   | dropdown                    | requires an `"options": [...]` array |

Each field supports: `id` (unique key), `label`, `type`, `required`
(true/false), `placeholder`, and — for `select` — `options`.

The form on the page is built **entirely** from this array, in order, for
whichever job was matched. Two jobs can have completely different forms.

---

## How to change a payment link

In `jobs.json`, find the job and edit its `paymentLink` value:

```json
"paymentLink": "https://payoneer.com/YOUR_NEW_LINK"
```

The "Pay Registration Fee" button always opens whatever `paymentLink` is set
for that job — no code changes needed.

---

## How to change the WhatsApp number

Two places:

1. **Per job** (used for the "Send Registration via WhatsApp" button on that
   job): edit `whatsapp` inside the job object in `jobs.json`. Use the full
   international number with no `+`, spaces, or dashes, e.g. `"923125540048"`.
2. **Site-wide default fallback** (used only if a job has no `whatsapp`
   field): edit `defaultWhatsapp` in `config.json`.

---

## How to add or change requirements

Edit the `requirements` array for that job in `jobs.json`. Each string
becomes one line item with a checkmark on the Job Details screen:

```json
"requirements": [
  "Microsoft Excel",
  "Basic English",
  "Internet Connection"
]
```

---

## How to change site branding / text

Open `config.json`:

- `site` — logo initials, site name, tagline, footer text, support email,
  default theme, default Whatsapp/Telegram fallback.
- `text` — every label and message shown on screen (headings, button
  labels, error messages, instructions).
- `steps` — labels for the 5-step progress bar at the top of the page.

---

## How the registration flow works

1. **Job Code** — visitor types a code; it's matched (case-insensitive)
   against `id` in `jobs.json`.
2. **Job Details** — title, company, description, requirements, fee, and a
   link to the company website, all pulled from the matched job.
3. **Registration Form** — dynamically generated from that job's
   `formFields`.
4. **Payment** — shows a success message, the fee, and a button that opens
   `paymentLink` in a new tab.
5. **Finish** — a reference number is generated (`JOBCODE-YYMMDDHHMMSS-###`),
   and the visitor can:
   - **Send Registration via WhatsApp** — opens `wa.me` with a pre-filled
     message containing the job, reference number, and every field they
     entered.
   - **Download Registration PDF** — generates a PDF receipt (job name,
     applicant info, date & time, reference number) using the
     [jsPDF](https://github.com/parallax/jsPDF) library loaded from a CDN.
     This is the only external library used in the project.

No data is sent to any server — everything runs client-side in the
visitor's browser. If you want submissions stored centrally, you would need
to add a backend or a service like Google Sheets/Firebase and post the form
data to it inside `handleFormSubmit()` in `assets/js/app.js`.

---

## Deploying to GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Push all these files to the repository, keeping the folder structure
   intact (`index.html` at the repo root).
3. In the repository, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Choose the branch (usually `main`) and folder `/ (root)`, then **Save**.
6. GitHub will publish the site at:
   `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`
7. Whenever you edit `jobs.json` (or `config.json`) and push the change,
   GitHub Pages redeploys automatically within a minute or two.

That's the entire workflow — **adding a new job is always just a
`jobs.json` edit and a `git push`.**

---

## Design notes

- Dark mode is default; the toggle in the top-right switches to light mode
  and remembers the choice (`localStorage`).
- Job codes and reference numbers use a monospace type with a
  "boarding-pass" perforation motif to reinforce that they are the
  verifiable, unique identifiers of the flow.
- No UI framework is used — plain HTML/CSS/vanilla JS — to keep the site
  fast-loading and easy to maintain. jsPDF (CDN) is the only dependency,
  used solely for the PDF receipt.
