---
name: manage-custom-tools
description: Create and manage custom webhook tools for the BubblaV chatbot via the MCP server. Use when a user wants to add, create, update, list, delete, or toggle custom tools for their chatbot (e.g. "add a tool that looks up order status").
---

Use this skill when the user asks to create, update, delete, list, or manage **custom tools** for their BubblaV chatbot. Custom tools are webhooks the chatbot can call during a conversation (look up an order, search inventory, book a slot, etc.).

Examples of when to activate:
- "Add a custom tool to my chatbot that looks up order status"
- "Create a tool for my chatbot to check product inventory"
- "List my custom tools"
- "Update the endpoint URL for my search tool"
- "Disable the weather tool on my website"
- "Delete the old API tool"

The MCP server is already connected over OAuth — you do **not** need an API key. Call the MCP tools by name directly.

## Available tools

Call these by name (no JSON-RPC wrapper, no auth header — the connection handles it):

| Tool | Purpose |
|------|---------|
| `bubblav_list_custom_tools` | List tools + per-website activation status |
| `bubblav_create_custom_tool` | Create a new webhook tool |
| `bubblav_update_custom_tool` | Update fields of an existing tool |
| `bubblav_delete_custom_tool` | Permanently delete a tool |
| `bubblav_toggle_custom_tool` | Enable/disable a tool for the current website |

---

## bubblav_create_custom_tool

Create a new custom webhook tool.

**Required arguments:**
- `tool_name` — unique identifier, matches `^[a-zA-Z0-9_-]+$` (letters, numbers, underscores, hyphens). Unique per user.
- `display_name` — human-readable name (shown in the dashboard).
- `description_for_ai` — instructions for the chatbot AI on **when** to use this tool (max 1000 chars; scanned for prompt injection).
- `endpoint_url` — the webhook URL to call (HTTPS, public; SSRF-validated — no private IPs / localhost).
- `authentication_type` — `none`, `bearer`, or `hmac` (see Authentication Types below).

**Optional arguments:**
- `description` — short human-facing summary (auto-derived from `description_for_ai` if omitted).
- `argument_schema` — flat parameter map describing the tool's inputs (see format below).
- `http_method` — `GET` (default), `POST`, `PUT`, `PATCH`, or `DELETE`.
- `activate_for_website` — auto-activate the tool for the current website (default `true`).

Example:
```json
{
  "name": "bubblav_create_custom_tool",
  "arguments": {
    "tool_name": "find_tournaments",
    "display_name": "Find Tournaments",
    "description_for_ai": "Search for pickleball tournaments near a given city. Use when a visitor asks about upcoming tournaments in their area.",
    "description": "Searches pickleball tournaments by city and radius",
    "endpoint_url": "https://api.example.com/tournaments/search",
    "authentication_type": "bearer",
    "http_method": "GET",
    "argument_schema": {
      "city": { "type": "string", "description": "City name to search near", "method": "query", "required": true },
      "radius_miles": { "type": "number", "description": "Search radius in miles (default: 50)", "method": "query", "default": 50 }
    }
  }
}
```

**Important:** if `authentication_type` is `bearer` or `hmac`, the response returns a `secret_key` **only once**. Share it with the user immediately and tell them to store it securely — it cannot be retrieved again.

## bubblav_update_custom_tool

Update an existing tool. Provide `tool_id` (from `bubblav_list_custom_tools`) and only the fields to change.

```json
{
  "name": "bubblav_update_custom_tool",
  "arguments": {
    "tool_id": "uuid-from-list",
    "description_for_ai": "Updated instructions for the AI...",
    "http_method": "POST"
  }
}
```

Optional fields: `display_name`, `description_for_ai`, `description`, `endpoint_url`, `authentication_type`, `argument_schema`, `http_method`, `is_active`. Switching `authentication_type` to `none` clears the secret key.

## bubblav_toggle_custom_tool

Enable or disable a tool **for the current website** (activation is per-website).

```json
{ "name": "bubblav_toggle_custom_tool", "arguments": { "tool_id": "uuid-from-list", "enabled": true } }
```

## bubblav_delete_custom_tool

Permanently delete a tool (cannot be undone; cascades per-website activations).

```json
{ "name": "bubblav_delete_custom_tool", "arguments": { "tool_id": "uuid-from-list" } }
```

## bubblav_list_custom_tools

List all custom tools with their activation status for the current website. No arguments.

```json
{ "name": "bubblav_list_custom_tools", "arguments": {} }
```

Returns `{ "tools": [...], "total": N }`. Secret keys are not returned (each tool has a `has_secret` boolean).

---

## argument_schema format (flat parameter map)

`argument_schema` must be a **flat object whose top-level keys are the real parameter names**. Each value describes one parameter and may include:

- `type` — `string` | `number` | `boolean` | `object` | `array`
- `description` — what the parameter is
- `required` — boolean
- `default` — default value (used when not required and the AI omits it)
- `method` — `query` | `body` | `path` (path params use `/users/{id}` style)

```json
{
  "q": { "type": "string", "description": "City or location to search", "required": true, "method": "query" },
  "appid": { "type": "string", "description": "OpenWeatherMap API key", "required": false, "default": "YOUR_KEY", "method": "query" }
}
```

**Do NOT** send JSON-Schema wrapper keys (`type`, `properties`, `required`) at the top level — those are reserved. Top-level keys are parameter names only.

---

## Authentication Types

When creating a tool, choose `authentication_type` based on how the user's webhook endpoint verifies requests.

### `none` — No Authentication
- **Use when**: public APIs, internal testing, or when the API key is passed as a query parameter.
- **Headers sent**: none. Anyone with the endpoint URL can call it — only use for genuinely public APIs.

### `bearer` — Bearer Token
- **Use when**: the endpoint expects `Authorization: Bearer <token>`.
- **How it works**: BubblaV generates a `secret_key`; on every call it sends:
  ```
  Authorization: Bearer <secret_key>
  ```
- **The user must**: store the `secret_key` server-side and validate the header. Example (Node.js):
  ```javascript
  // secretKey: the secret_key BubblaV returned when the tool was created,
  // loaded from the endpoint's own secret store.
  function isFromBubblaV(req, secretKey) {
    const token = req.headers.authorization?.split(' ')[1];
    return token === secretKey;
  }
  ```

### `hmac` — HMAC Signature (most secure)
- **Use when**: production endpoints with sensitive data; prevents replay attacks and proves request authenticity.
- **How it works**: BubblaV signs every request and sends two headers:
  ```
  X-BubblaV-Signature: sha256=<hex_signature>
  X-BubblaV-Timestamp: <unix_ms_timestamp>
  ```
- **Signature**: `HMAC_SHA256(secret_key, "<timestamp>.<json_body>")` where `<json_body>` is the compact request body string.
- **The user must**: store the `secret_key` and verify the signature + timestamp server-side. Example (Node.js):
  ```javascript
  const crypto = require('crypto');
  // secretKey: the secret_key BubblaV returned when the tool was created,
  // loaded from the endpoint's own secret store.
  function isFromBubblaV(req, secretKey) {
    const sig = req.headers['x-bubblav-signature']?.replace('sha256=', '');
    const ts = req.headers['x-bubblav-timestamp'];
    // Reject requests older than 5 minutes (replay protection)
    if (Date.now() - parseInt(ts) > 300000) return false;
    const expected = crypto.createHmac('sha256', secretKey)
      .update(`${ts}.${JSON.stringify(req.body)}`).digest('hex');
    return sig === expected;
  }
  ```

### Recommendations

| Scenario | Auth Type |
|----------|-----------|
| Public API (weather, search) | `none` |
| Internal API with simple auth | `bearer` |
| Production API, sensitive data | `hmac` |
| User unsure | `hmac` (safest default) |

The request body BubblaV POSTs to the endpoint looks like:
```json
{
  "tool_name": "get_order_status",
  "arguments": { "order_number": "ORD-12345", "include_items": true },
  "timestamp": 1703123456789,
  "user_id": "uuid-of-website-owner"
}
```
Expected success response: `{ "success": true, "data": {...}, "message": "..." }` — the `message` is what the AI relays to the visitor. Webhook calls time out after 10 seconds.

---

## Notes

- **`secret_key` is shown only once at creation.** Share it with the user immediately and tell them to save it.
- Tools are **user-level** (shared across the user's websites); **activation is per-website**. Use `bubblav_toggle_custom_tool` to enable a tool on a specific site.
- `tool_name` must be unique per user and match `^[a-zA-Z0-9_-]+$`.
- `endpoint_url` is validated for SSRF (no private IPs, localhost, or internal ranges) and redirects are blocked.
- `description_for_ai` is security-scanned for prompt-injection patterns.
- Some features may require a paid plan; if so, the tool call returns a `PLAN_REQUIRED` error.
- Always call `bubblav_list_custom_tools` first to avoid creating duplicate tools.
- Full docs: **https://docs.bubblav.com/user-guide/integrations/custom-tools**.

## Example Flow

User: "Add a tool to look up order status by order number."

1. Call `bubblav_list_custom_tools` to check for an existing order-status tool.
2. Call `bubblav_create_custom_tool`:
   ```json
   {
     "name": "bubblav_create_custom_tool",
     "arguments": {
       "tool_name": "get_order_status",
       "display_name": "Get Order Status",
       "description_for_ai": "Look up the status of a customer's order by order number. Use when a visitor asks where their order is or about shipping/delivery.",
       "endpoint_url": "https://api.example.com/orders/lookup",
       "authentication_type": "hmac",
       "http_method": "GET",
       "argument_schema": {
         "order_number": { "type": "string", "description": "The order number to look up", "required": true, "method": "query" }
       }
     }
   }
   ```
3. Share the returned `secret_key` with the user (shown only once) and explain the HMAC verification they must add to their endpoint.
4. Confirm the tool is active for their website (check the create response's `is_active_for_website`, or call `bubblav_list_custom_tools`).
