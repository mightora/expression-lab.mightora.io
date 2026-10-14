# Mightora Power Automate Expression Lab

A **free, privacy-conscious, static web application** for learning, exploring and testing a *subset* of Power Automate Workflow Definition Language (WDL) expressions against custom JSON data.

## Features

- Interactive expression editor with keyboard shortcut `Ctrl/⌘ + Enter`.
- Local, safe parser and evaluator; no JavaScript `eval`, no API or Microsoft tenant integration.
- 14 curated, editable examples; searchable supported-function explorer.
- Mock `triggerBody()`, `triggerOutputs()`, `body()`, `outputs()`, `variables()`, `parameters()`, `items()` and `item()` sources.
- Text interpolation with `@{...}`, `@` expression prefix, bracket and null-safe property access.
- Locally generated result, explicit errors, clipboard copy.
- Matching online and standalone offline versions generated from shared source.
- Responsive Mightora design, components, author section, real workflow-evidence links, and network transparency instructions.

## Getting started

Requires Node.js 20+ and Python 3 for ZIP packaging. There are no npm dependencies.

```bash
npm run check
python3 -m http.server -d dist 8000
```

Open `http://localhost:8000`. The standalone `dist/downloads/expression-lab-offline.html` can be opened directly with `file://` without a server. The ZIP contains `index.html`, `README.txt`, and `LICENSE`.

## Publish to GitHub Pages

1. Create a public repository named `mightora/expression-lab.mightora.io` and push this source to the `main` branch.
2. Under **Settings → Pages**, choose **GitHub Actions** as the build and deployment source.
3. Optionally configure the custom domain `expression-lab.mightora.io` in Pages and DNS. Do not claim the domain is live until verified.
4. `deploy.yml` builds, tests, embeds the locally versioned official full Mightora logo, and deploys `dist/`; `ci.yml`, `codeql.yml` and `dependency-review.yml` provide separate controls.

The badge section links directly to the corresponding workflows, licence and repository. They are **links to evidence, not fabricated pass/fail claims**.

## Privacy, offline behaviour and disclosure

- **Online:** local expression evaluation; the browser loads Mightora shared CSS and components through jsDelivr, the official logo/author imagery from GitHub-hosted or blog resources, and footer metadata. No expression or context is sent to those services by this app. There is no analytics code.
- **Offline:** self-contained HTML with embedded CSS, JS, brand art and restrictive CSP (`connect-src 'none'`, `default-src 'none'`). All evaluation runs locally, with no app network requests.
- Open F12 → Developer Tools → Network → Preserve log → Reload to verify traffic. The built-in Resource Timing report can omit requests.
- The official full Mightora logo is included at `src/mightora-logo.png` and embedded into the offline edition by the build script. The online edition loads the prescribed full logo through the shared component.

## Evaluation limits

**This is not an official Microsoft or Power Automate runtime.** The local evaluator covers common strings, arrays, comparisons, math, conversions, selected UTC date functions, and simulated flow context. It does **not** execute connectors, expressions needing a running tenant, or all WDL functions; date formatting supports selected tokens only, `ticks()` uses approximate JS precision, and some null/coercion semantics can differ. Confirm all production expressions in Power Automate.

- Maximum expression length: 50,000 characters.
- Maximum parser nesting: 64 levels.
- Maximum evaluation operations: 2,000.
- No arbitrary JavaScript execution or dynamic code evaluation.
- No network requests from expression evaluation.

Reference: [Microsoft Workflow Definition Language expression functions](https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference).

## Open source

MIT © 2026 Ian Tweedie / Mightora. Pull requests welcome. All functionality is maintained under `src/` and packaged by `tools/build.mjs` for release parity.
