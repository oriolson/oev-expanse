# Little Proof — design preview

Step 1 of [issue #11](https://github.com/oriolson/oev-expanse/issues/11):
the selected name, draft copy, and a revised responsive visual direction for a photo
keychain pop-up. **For review only. Not published or ready to take inquiries.**

Concept 03 is a simpler one-sheet zine: a black masthead, monochrome halftone
illustration, short copy, and one blue inquiry link. No navigation or cards.
Design references and their scope are documented in `copy.md`.

## Paid pilot drafts

- [Pilot brief](pilot-brief.md): one venue trial, draft price, and host questions.
- [Outreach](outreach.md): an unsent Instagram DM and email.
- [Event checklist](event-checklist.md): a reusable phone-friendly run sheet.

Materials are purchased and the product is tested. These drafts replace the
earlier broad business plan; prices and host terms still need approval.
This repository is public. Keep actual contact details, costs, availability,
and event records in private copies outside the repository, not in these files.
Real sample photos are pending approval; outreach does not need to wait for them.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory keychain-popup
```

Open <http://localhost:8000>. No build, dependencies, or external services.

## Edit

- `index.html`: visual preview and displayed copy.
- `style.css`: layout, typography, and color tokens.
- `assets/`: original SVG concept artwork and favicon.
- `copy.md`: naming rationale, visual direction, and draft copy for review.

Copy is intentionally plain HTML in this first preview. Keep `copy.md` in sync
when revising the proposal. Do not introduce a framework or content pipeline just
for the preview.

## Scope and next step

Little Proof is the selected name. Review the visual direction and copy before completing the working page.
Inquiry links currently lead to an explicit placeholder, not email. The page uses
`noindex, nofollow`; this is not access control or permission to publish.

Before launch, confirm the name's availability, replace the contact placeholder
with a confirmed business email, approve the assets, and get explicit publishing
approval. No public pricing, booth rental, or printing is included.
