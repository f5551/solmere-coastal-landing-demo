# Solmere — Project Documentation

## 1. Project purpose and scope

Solmere is a static, one-page concept demo prepared to demonstrate frontend implementation for a coastal residential website brief. It is not the client's original design or final property website. The original design files, approved property assets, verified location information, and developer identity have not been supplied. The page therefore uses sample Unsplash photography, conceptual map artwork, concept copy, and placeholder branding.

The enquiry form is kept in Demo Mode. It validates in the browser and displays a demo confirmation; it does not send or store submitted information.

## 2. Architecture

| Path | Responsibility |
| --- | --- |
| `index.html` | Semantic page sections, accessible content, local image sources, SEO/social metadata, and enquiry form configuration. |
| `styles.css` | Design tokens, premium coastal palette, layout, responsive breakpoints, focus styles, and reduced-motion rules. |
| `script.js` | Header state and menu, lifestyle image selection, carousel navigation, image fallback handling, validation, and Demo Mode form behavior. |
| `assets/` | Responsive AVIF sample photos and `conceptual-coast-map.svg`. These are local demonstration assets. |
| `favicon.svg` | Generic concept-demo browser icon. |
| `server.js` | Dependency-free Node development server bound to `127.0.0.1:8000`; not used in production. |
| `api/enquiry.js` | Optional Vercel-style serverless handler. It is unconfigured, excluded from the Pages artifact, and inactive. |
| `.github/workflows/pages.yml` | GitHub Actions deployment that stages only static website files and publishes the Pages artifact. |
| `README.md` | Setup, deployment, content editing, and optional form integration instructions. |
| `CLIENT_DEMO_OVERVIEW.md` | Short client-facing explanation of the demonstration. |

No frontend framework, package manifest, compilation step, or third-party JavaScript dependency is used. Image paths and the favicon are relative, so they work under the repository subpath `/<repo>/` on GitHub Pages.

## 3. Functionality

### Navigation

- Desktop section links scroll to page sections.
- The mobile menu updates `aria-expanded`, closes after navigation, and supports Escape.
- The header changes appearance after scrolling.

### Lifestyle selector

The left-side list updates the right-side image, alt description, active tab state, and panel label. Input handlers support pointer hover, click, focus, and arrow-key navigation. A failed image load uses the existing fallback treatment.

### Interiors carousel

Previous/next buttons and numbered indicators update the active slide. The carousel wraps at both ends, supports keyboard arrow/Home/End commands, recenters on viewport resize, and listens for touch/pen pointer swipes. Reduced-motion styles shorten or remove transitions.

### Enquiry form

Five fields are validated: first name, surname, phone, email, and referral source. Inline field messages are connected to inputs with ARIA attributes, and a live status region communicates errors or the Demo Mode result. Production submission is intentionally inactive.

## 4. GitHub Pages deployment pipeline

The workflow runs on pushes to `main` and can be started manually. It copies only the site shell and `assets/` into `_site`, uploads that folder as the Pages artifact, then deploys it. It does not copy `server.js` or `api/enquiry.js`; no email endpoint or credentials are published. The repository's **Settings → Pages → Build and deployment → Source** must be set to **GitHub Actions** before the workflow can deploy.

Expected URL: <https://f5551.github.io/solmere-coastal-landing-demo/>. On 2026-10-30, that public URL returned GitHub Pages' 404 (“There isn't a GitHub Pages site here”), so Pages activation is still pending. The repository Settings source must be changed to GitHub Actions, then the workflow must complete successfully before this can be called deployed. The page has no production domain, canonical URL, or `og:url`. Social preview imagery and Google Fonts are external requests; local page images and the conceptual map are included in the artifact.

## 5. Verification record

### Source and local checks

- `node --check script.js` — passed.
- `node --check server.js` — passed.
- `node --check api/enquiry.js` — passed.
- Local HTTP checks for the page, styles, script, favicon, and all assets — returned HTTP 200.
- Text-source secret-pattern scan — no credential-like matches; no `.env` files were present.

### Browser checks

Manual browser checks previously covered 320, 360, 390, 430, 768, 1024, 1440, and 1920 CSS-pixel widths. They found no horizontal overflow, verified map/boundary alignment and carousel centering after transitions, and exercised navigation, mobile-menu Escape behavior, lifestyle click/keyboard behavior, carousel arrows/dots/wraparound, and valid/invalid Demo Mode form submissions. Browser console errors/warnings were not observed in that run.

These checks are not an automated regression suite. Touch swipe and reduced-motion preference emulation were not directly tested in that environment. Lighthouse was not available locally. The current Pages 404 is a configuration blocker rather than an application 404: the repository's Pages publishing source still needs to be enabled.

## 6. Security, privacy, and limitations

- Demo Mode does not invoke the API, send form data, or persist it. The on-page privacy note tells visitors not to enter real personal information.
- The optional API source requires client-approved Resend, Cloudflare Turnstile, and Upstash configuration. Secrets must be stored in a serverless host's environment settings, never in source control. It is excluded from the GitHub Pages artifact.
- The conceptual map is not aerial imagery, a real location, or a verified property boundary.
- Sample photography and temporary branding do not represent the client's development.
- External Google Fonts and the Open Graph/Twitter preview image depend on external network availability.
- No live enquiry destination, production backend, custom domain, production hosting configuration, analytics, or cookie-consent system is configured.

## 7. Development background

The requested three-AI-tool comparison is noted here only in technical documentation. The repository and available project records do not provide the tools' names, prompts, outputs, or a reproducible comparison result; this document therefore makes no comparative quality claim. Do not use an unverified comparison as client-facing evidence.

The implementation is a working demonstration of capability. Once the client supplies the actual design files, images, branding, content, and agreed revisions, those materials can be applied to the existing structure while preserving the requested interactions and responsive behavior.
