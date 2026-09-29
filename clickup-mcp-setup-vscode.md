# Connect ClickUp MCP in VS Code (Claude Code)

Goal: get the ClickUp MCP server connected and authenticated in this VS Code / Claude Code
session so the task-sync workflow can run. Do these steps in order.

## 0. First check if it's already connected

If you're signed into the same Claude account that already has the ClickUp connector,
it may already be available. Test it:

> In Claude Code, ask: **"List the tasks in ClickUp list 901417499837."**

- If you get task results (or "0 tasks"), **you're done** — skip the rest.
- If it says there are no ClickUp tools or you get an auth error, continue below.

## 1. Add the ClickUp remote MCP server

ClickUp runs a hosted (remote) MCP server. Add it from your terminal:

```bash
claude mcp add --transport http clickup https://mcp.clickup.com/mcp -s user
```

- `clickup` is the local name for the server (use anything you like).
- `https://mcp.clickup.com/mcp` is ClickUp's hosted MCP endpoint.
- `-s user` installs it at **user scope** so it's available in every project, not just this
  one. Use `-s project` instead if you only want it in this repo (writes to `.mcp.json`).

Verify it registered:

```bash
claude mcp list
```

You should see `clickup` in the list (it may show as "needs authentication").

## 2. Authenticate (OAuth)

Inside a Claude Code session, run:

```
/mcp
```

Select **clickup** → choose **Authenticate** (or "Log in"). A browser window opens to
ClickUp's OAuth screen — approve access. When it returns, the server status should show
**connected**.

## 3. Confirm the tools are live

Back in the session, ask:

> **"List the tasks in ClickUp list 901417499837."**

If you get a clean result, the connection works and you can run the task-sync workflow.

---

## Alternative: add via `.mcp.json` (project scope)

If you prefer committing config to the repo instead of the CLI, create or edit `.mcp.json`
in the project root:

```json
{
  "mcpServers": {
    "clickup": {
      "type": "http",
      "url": "https://mcp.clickup.com/mcp"
    }
  }
}
```

Then restart Claude Code and run `/mcp` to authenticate as in step 2.

---

## Reference

```
ClickUp MCP endpoint:  https://mcp.clickup.com/mcp   (transport: http)
Add (user scope):      claude mcp add --transport http clickup https://mcp.clickup.com/mcp -s user
List servers:          claude mcp list
Authenticate:          /mcp   (inside a Claude Code session)
Smoke test:            "List tasks in ClickUp list 901417499837"
```

Once connected, follow `clickup-task-sync-instructions.md` for the backlog + ongoing
sync workflow.
