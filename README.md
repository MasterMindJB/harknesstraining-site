# harknesstraining.com

Six pages, one stylesheet, two scripts. No build step: upload this folder as-is to GitHub Pages.

| Page | File | Live address |
| --- | --- | --- |
| Home | `index.html` | harknesstraining.com |
| Open Lab | `open-night.html` | harknesstraining.com/open-night |
| Pricing | `pricing.html` | harknesstraining.com/pricing |
| Book a demo | `demo.html` | harknesstraining.com/demo |
| Custom programs | `custom.html` | harknesstraining.com/custom |
| After Open Lab (QR code) | `next.html` | harknesstraining.com/next |

## The one place to edit: `assets/site.js`

The top of the file holds every link and the Open Lab schedule.

- `luma`: optional. Until it is set, "Save a seat" opens a short registration form on the page (sent through Formspree). Paste a Luma calendar link to send people to Luma instead.
- `formspree`: paste the Formspree form ID (the part after `formspree.io/f/`). Until then, forms open an email to hello@ with the details filled in.
- `social`: LinkedIn, YouTube and X links. An icon only appears once its link is filled in.
- `demoBooking`: the Google Calendar booking link (already set).
- `demoEmbed`: optional. In Google Calendar, open the appointment schedule, choose Share → Website embed → Inline, and paste the long URL (it ends in `?gv=true`). The demo page then shows the calendar on the page.
- `openNight`: first date (Oct 29), every 3 weeks, 4 upcoming dates shown. Every Open Lab has an online session (12:00–1:30 PM). From `inPersonFrom` (Dec 1, 2026) the first Open Lab of each month also has an in-person session (6:00–7:30 PM in El Segundo; the address goes out after registration). Past dates drop off automatically. To cancel a date, add it to `skip`, e.g. `skip: ["2026-12-31"]`.

## Share preview, icon and phone bar

- `assets/og.png` is the card that shows when someone shares a link in Slack, iMessage, LinkedIn or email. Every page points to it at `https://harknesstraining.com/assets/og.png`, so it appears once the site is live on that domain.
- `assets/favicon.svg` is the browser-tab icon; `assets/apple-touch-icon.png` is the home-screen icon on iPhone.
- On phones, a bar with Save a seat and Book a demo slides up after the first scroll and hides near the footer.

## Luma registration questions

Use the same questions on each event:
1. Name, work email, company, role
2. What conversation do you want to practice? (required)
3. Is your manager or a leader coming to watch?
4. How did you hear about us?

## Formspree

One form handles all five site forms (Open Lab registration, contact, the pricing estimate, custom program inquiries, after-Open-Night). Each submission arrives with a subject line saying which form it came from. To also send the estimate to the buyer automatically, turn on Formspree's autoresponse (a paid plan feature); otherwise reply by hand.

## Go live

1. On GitHub, create the organization `harknesstraining`, then a public repo named `harknesstraining.github.io`.
2. Upload every file in this folder (keep the `assets` folder).
3. Repo Settings → Pages → Source: deploy from the `main` branch, root folder. Custom domain: `harknesstraining.com`.
4. In GoDaddy DNS, add A records for `@` pointing to 185.199.108.153, 185.199.109.153, 185.199.110.153 and 185.199.111.153, and a CNAME for `www` pointing to `harknesstraining.github.io`. Remove any old A records or forwarding.
5. Once GitHub shows the domain as verified, tick "Enforce HTTPS".
6. Remove any old pages that still carry child-welfare copy.
7. From a personal email account, test: each Save a seat button, Book a demo, the contact form, and the estimate form.
8. Point the QR code on the 4×6 card at `https://harknesstraining.com/next`.
