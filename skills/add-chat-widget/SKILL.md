---
name: add-chat-widget
description: Install the BubblaV chat widget on a website by fetching the ready-to-paste embed snippet and guiding placement. Use when a user wants to add, embed, install, or add the chatbot code / chat bubble to their site.
---

Use this skill when the user wants to put the BubblaV chat widget on their website.

Examples of when to activate:
- "Add the chat widget to my site"
- "How do I install BubblaV on my Webflow site?"
- "Give me the embed code for my chatbot"
- "Add the chat bubble to my Shopify store"

The MCP server is already connected over OAuth — you do **not** need an API key. Call the MCP tools by name directly.

## Step 1 — Get the embed snippet

Call **`bubblav_get_widget_snippet`** (no arguments). It returns:

```json
{
  "website_id": "uuid",
  "website_name": "Acme Inc",
  "website_url": "https://acme.com",
  "script_src": "https://www.bubblav.com/widget.js",
  "snippet": "<script src=\"https://www.bubblav.com/widget.js\" data-site-id=\"uuid\" defer></script>",
  "instructions": "..."
}
```

The `snippet` is exactly what to paste. It is keyed by the website `id` (the `data-site-id` attribute). The website is the one bound to this MCP connection — you don't choose it.

**Fallback** (only if `bubblav_get_widget_snippet` is not available on an older server): call **`bubblav_get_website_settings`**, read its `id` field, and build the snippet yourself:

```html
<script src="https://www.bubblav.com/widget.js" data-site-id="<id>" defer></script>
```

## Step 2 — Where to paste

Paste the snippet **just before the closing `</body>` tag** on every page that should show the widget (or once in the site-wide `<head>`). A single line is all you need — the widget downloads its colors, text, position, and greeting from BubblaV at runtime, so there is nothing else to configure in the snippet.

### Framework placement

- **Next.js (app router)** — in the root layout, using `next/script`:
  ```tsx
  import Script from 'next/script';
  // ...inside the layout component:
  <Script src="https://www.bubblav.com/widget.js" data-site-id="<id>" strategy="lazyOnload" />
  ```
- **Next.js (pages router)** — add the `<script ... defer></script>` tag in `pages/_document.tsx` before `</body>`.
- **React (CRA/Vite)** — add the tag in `public/index.html` (or `index.html`) before `</body>`, or inject it via a `useEffect` in the root component.
- **Vue / Nuxt** — before `</body>` in `index.html` / `app.vue`.
- **Angular** — before `</body>` in `src/index.html` (or `angular.json` scripts array).
- **Svelte / SvelteKit** — before `</body>` in `app.html`.
- **Astro** — in a layout `.astro` file before `</body>`.
- **Plain HTML** — before `</body>`.

### CMS / website builders

| Platform | Where to paste |
|----------|----------------|
| **WordPress** | "Insert Headers and Footers" plugin (footer), or the official **BubblaV Chat** plugin; or `footer.php` before `</body>`. |
| **WooCommerce** | Same as WordPress (it is a WordPress site). |
| **Shopify** | Edit `theme.liquid` before `</body>`, or install the official BubblaV Shopify app. |
| **BigCommerce** | Storefront → Script Manager (or the official app). |
| **Webflow** | Project Settings → Custom Code → Footer Code (or the official Webflow app). |
| **Framer** | Site Settings → General → End of `</body>` tag (or the official Framer plugin). |
| **Wix** | Settings → Custom Code → Body-end (requires Wix Premium). |
| **Squarespace** | Settings → Advanced → Code Injection → Footer (Business plan or higher). |
| **Google Tag Manager** | New Custom HTML tag with the snippet, trigger = All Pages. |
| **Joomla / Drupal** | Custom HTML module / "Add to Head" module, or edit the theme footer template. |

Full step-by-step for each: **https://docs.bubblav.com/user-guide/installation**.

## Step 3 — Content Security Policy (CSP)

If the site has a CSP, allow BubblaV for scripts and frames:

```
script-src 'self' https://www.bubblav.com;
frame-src  'self' https://www.bubblav.com;
```

## Step 4 — Verify

1. Save and deploy the change.
2. Open the live site — the chat bubble appears (bottom-right by default).
3. In the BubblaV dashboard → Analytics, confirm `widget_page_view` events start arriving.

## Notes

- **One snippet per website.** Each website has its own `data-site-id`. To put the widget on a different website, connect that website's MCP context first.
- The snippet never contains secrets — the `data-site-id` is a public identifier; the widget pulls config from a public endpoint.
- Appearance (colors, position, greeting, bot name) is controlled in the dashboard Design page or via `bubblav_update_widget_appearance`, **not** by editing the snippet.
