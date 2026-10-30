# Solmere — Coastal Residential Concept Demo

A responsive, one-page coastal residential **concept demonstration** built with semantic HTML, CSS, and vanilla JavaScript. It showcases a polished presentation and common real-estate landing-page interactions. It is not the client's final website and does not describe a verified property.

> **Demo Mode:** The enquiry form validates entries in the browser, displays a demonstration confirmation, and does not send or store the entered information. Do not enter real personal information.

## Features

- Full-width photographic hero, transparent section navigation, and mobile menu.
- Centered editorial sections, large sample photography, and an illustrative coastal map with a conceptual boundary overlay.
- Lifestyle selector with synchronized image and description.
- Interiors carousel with centered active slide, neighboring slides, numbered indicators, arrows, keyboard controls, and touch-pointer handling.
- Responsive enquiry form with field-level validation and accessible status/error messages.
- Keyboard focus states, reduced-motion CSS support, local favicon, and demo-accurate metadata.
- Local AVIF and SVG assets; no frontend framework, package installation, or build dependency.

## Project structure

```text
.
├── index.html                 Page content, metadata, responsive image sources, and demo form
├── styles.css                 Design tokens, layouts, responsive rules, and focus states
├── script.js                  Navigation, lifestyle selector, carousel, and form behavior
├── favicon.svg                Generic concept-demo favicon
├── assets/                    Local AVIF sample photography and conceptual map illustration
├── api/
│   └── enquiry.js             Optional, inactive Vercel serverless enquiry handler
├── server.js                  Loopback-only local static development server
├── CLIENT_DEMO_OVERVIEW.md    Purpose and scope of the demonstration
├── .gitignore                 Excludes local secrets and generated files
└── README.md                  Setup, editing, deployment, and integration notes
```

There is no `package.json` or frontend dependency to install. The optional API handler is included as source for a later, client-approved integration; it is not part of the static Demo Mode deployment.

## Run locally

Install Node.js, open a terminal in the project directory, and run:

```sh
node server.js
```

Visit <http://127.0.0.1:8000/>. The server binds to `127.0.0.1` only and is for local preview, not production hosting. Stop it with `Ctrl+C`. No npm install or build step is required.

## Static demo deployment

The website itself is static. A demo deployment requires only `index.html`, `styles.css`, `script.js`, `favicon.svg`, and the complete `assets/` directory. Keep the relative paths unchanged. Do not expose the local development server as a public production server. Demo Mode needs no Node server after deployment.

For Cloudflare Pages Git integration, use this build command and output directory:

```sh
mkdir -p dist && cp index.html styles.css script.js favicon.svg dist/ && cp -R assets dist/assets
```

Set the build output directory to `dist`. This stages only the static website files; the command does not install dependencies. Other static hosts are suitable if they serve HTML, CSS, JavaScript, SVG, and AVIF correctly. See the [Cloudflare Pages static HTML guide](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/).

The project does not specify a production domain, canonical URL, or `og:url`. The social preview image and Google Fonts stylesheet are external requests; their availability depends on the network and preview crawler. Preview the actual hosted build and verify its assets, favicon, and Demo Mode before sharing. No deployment is performed by this repository setup.

## Update demo content

- **Text and page metadata:** Edit the copy, title, description, Open Graph, and Twitter fields in `index.html`. Keep concept-demo wording until verified client copy is approved.
- **Photography:** Replace the image `src`, `srcset`, `sizes`, `data-image`, and `data-alt` values in `index.html` with approved assets. Existing AVIF photos are Unsplash samples, not images of the Solmere development. Current source photo IDs: `1510414842594-a61c69b5ae57` (hero), `1600607687939-ce8a6c25118c` (editorial/interior), `1473116763249-2faaef81ccda`, `1507525428034-b723cf961d3e`, `1470252649378-9c29740c9fa8`, `1441974231531-c6227db76b6e` (lifestyle), `1600210492486-724fe5c67fb0`, `1600607687644-c7171b42498f`, and `1600566753086-00f18fb6b3ea` (interiors). Review the [Unsplash License](https://unsplash.com/license) and any additional usage rights before production use. Preserve accurate alt text, responsive candidates, and lazy loading below the fold; the hero uses high loading priority.
- **Map:** `assets/conceptual-coast-map.svg` and the overlaid boundary are conceptual artwork, not a real map or verified geographic boundary. Replace them only with approved map art and client-verified boundary data.
- **Branding:** The wordmark is concept branding. The developer area is a labeled placeholder; replace it only with the supplied logo and approved company information.
- **Colors and typography:** Update the CSS custom properties near the top of `styles.css`. Google Fonts are external; Georgia and Arial fallback stacks are defined for unavailable fonts.

## Enquiry form and privacy

The form in `index.html` is configured with `data-mode="demo"`, an empty endpoint, and no Turnstile site key. Its demo branch validates the five fields and shows a local confirmation. It does not call the endpoint, transmit the form values, or store them. The visible privacy note explains this behavior.

### Optional production integration — inactive

`api/enquiry.js` follows the Vercel serverless function convention and implements server-side field allow-listing/validation, same-origin allow-listing, a honeypot, Cloudflare Turnstile verification, Upstash Redis rate limiting, and Resend delivery. The frontend only enters its production submission path when the production mode and required public configuration are present. The local static server cannot run this API handler, and a static-only host will not activate it.

Before considering activation, obtain client approval for the destination email, provider, sender identity, privacy/retention wording, consent requirements, domain, and hosting. Configure these **server-side secrets** in the selected host's environment settings; never commit their values:

| Variable | Purpose |
| --- | --- |
| `EMAIL_PROVIDER` | `resend` (the implemented provider) |
| `RESEND_API_KEY` | Private Resend API key |
| `EMAIL_FROM` | Approved sender on the verified sending domain |
| `ENQUIRY_TO` | Client-approved recipient |
| `TURNSTILE_SECRET_KEY` | Private Turnstile secret |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Private Upstash token |
| `RATE_LIMIT_HASH_SECRET` | Random secret, at least 32 characters |
| `ALLOWED_ORIGINS` | Exact allowed origins, comma-separated |

The Turnstile site key is public configuration; all keys and tokens above remain server-side. Do not switch to production mode until the client approves the integration and it has been tested in a staging environment with synthetic data. The success response means provider acceptance for processing, not guaranteed inbox delivery.

## Client inputs still needed for a final property website

- Original design files and approved revisions.
- Approved property photography, fonts, copy, and verified property information.
- Developer name, logo, and brand guidelines.
- Client-approved map artwork and verified boundary data.
- Production domain, hosting decision/access, and approved sharing URL/image.
- Enquiry destination, provider accounts, sender domain, privacy wording, and any required consent/retention/legal review.

This is a technical and visual demonstration intended for review. It is not a live listing, a production enquiry service, or a deployed client website.
