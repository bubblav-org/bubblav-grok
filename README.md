# BubblaV for Grok

Manage your [BubblaV](https://www.bubblav.com) AI chatbot from Grok Bot and Grok Build. BubblaV is an AI chatbot for businesses: it answers your customers' questions 24/7 with what you teach it, and hands chats to your team when needed.

With this plugin, Grok can add the chat widget to the site you are building, check how your chatbot performs, find the questions it could not answer, teach it new knowledge, review conversations and leads, and change its persona and widget. The plugin connects to the BubblaV remote [MCP](https://modelcontextprotocol.io/) server at `https://www.bubblav.com/mcp` over OAuth. You do not need an API key.

## Install

**Grok Bot.** Open **Connect apps**, search for **BubblaV**, and add it. You can also ask your Bot: "Add the BubblaV app."

**Grok Build (CLI).** Add this repository as a marketplace source, then install the plugin:

```bash
grok plugin marketplace add https://github.com/bubblav-org/bubblav-grok
grok plugin install bubblav
```

Or install it straight from the repository:

```bash
grok plugin install https://github.com/bubblav-org/bubblav-grok
```

## Connect your account

The first time Grok calls a BubblaV tool, your browser opens the BubblaV sign-in page.

1. Sign in to BubblaV, or create an account.
2. Select the chatbot (website) that Grok can manage. If you do not have a website, you can create a chatbot without one.
3. Approve the request.

Grok runs the OAuth 2.1 flow with PKCE for you. There are no secrets or tokens to copy.

## What you can do

- **Install the widget**: get the embed code for your chatbot and add it to your project.
- **Check performance**: conversations, resolution rate, ratings, and response times for any date range.
- **Find gaps**: questions your chatbot could not answer, content gaps, and the questions people ask most.
- **Teach your chatbot**: add or remove knowledge, upload documents, add pages and sitemaps to crawl, and check crawl status.
- **Review conversations**: list, read, and search conversations, captured leads, and visitor insights.
- **Configure**: change the chatbot persona and instructions, the chat widget, the AI search widget, forms, flows, and custom webhook tools.

Example prompts:

- "How is my BubblaV chatbot performing this month?"
- "Which questions could my chatbot not answer last week?"
- "Add to my chatbot's knowledge: we are open Monday to Friday, 9 AM to 5 PM."
- "Add the BubblaV chat widget to this Next.js app."

## Skills included

- **`add-chat-widget`**: gets the embed snippet for your chatbot and shows where to put it in your site or framework. Grok can add the snippet to your project files when you ask.
- **`manage-custom-tools`**: creates, updates, lists, deletes, and turns on or off the custom webhook tools that your chatbot can call during a conversation.

## Data and privacy

- **What the plugin contains**: one MCP server declaration (`.mcp.json`), two skills (Markdown files), plugin manifests (`.grok-plugin/`, `.cursor-plugin/`), a logo, and a validation script for maintainers (`scripts/validate-plugin.mjs`). Grok does not run the script. The plugin has no hooks, commands, or agents, and it does not read your environment variables or local files on its own.
- **Network endpoints**: the plugin sends requests only to `https://www.bubblav.com/mcp`. A request contains the tool name and the arguments that Grok sends for your request.
- **Credentials**: none in the plugin. You sign in to BubblaV over OAuth; Grok stores the token.
- **What data comes back**: data from the BubblaV chatbot that you authorized. This includes analytics, knowledge content, settings, and conversations. Conversations and leads can contain your visitors' names, email addresses, and messages.
- **Access**: one connection gives access to one chatbot. BubblaV creates an API key for the connection in your account. To disconnect, revoke that key in the BubblaV dashboard.
- **Audit log**: BubblaV logs every tool call. See **Integrations → MCP Settings → Audit Logs** in the dashboard.
- **Custom tools**: when you create a custom webhook tool, BubblaV's servers call the URL that you give, during visitor conversations. For `bearer` and `hmac` tools, BubblaV shows the secret key one time, in the tool response.
- **Policies**: [Privacy Policy](https://www.bubblav.com/privacy) · [Terms of Service](https://www.bubblav.com/terms)

## Validate

```bash
grok plugin validate .
node scripts/validate-plugin.mjs
```

The script checks that both manifests are valid JSON with the same kebab-case name and version, the logo is committed and referenced, and `.mcp.json` points at the BubblaV server.

## Requirements

- A BubblaV account. You can create one during the sign-in step.
- Grok Bot, or Grok Build with plugin support.

## Support

- Setup guide: [docs.bubblav.com/user-guide/integrations/grok](https://docs.bubblav.com/user-guide/integrations/grok)
- Tool reference: [docs.bubblav.com/developer-guide/mcp-server](https://docs.bubblav.com/developer-guide/mcp-server)
- Email: [support@bubblav.com](mailto:support@bubblav.com)

## License

MIT. See [LICENSE](LICENSE).
