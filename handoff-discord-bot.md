# Discord Bot Handoff — pavezbot

## What This Is

pavezbot is a Discord bot that forwards DMs to Claude Code running on Dave's Mac. Claude can execute terminal commands, read/write files, push code, and do anything it can do in a normal Claude Code session — all triggered from Discord.

## Bot Details

- **Bot name:** pavezbot (pavezbot#4295)
- **Discord app:** created March 28, 2026
- **Plugin:** `discord@claude-plugins-official` (Anthropic official MCP plugin)
- **Token location:** `~/.claude/channels/discord/.env` on Dave's Mac
- **Access control:** pairing mode — Dave's Discord account is paired

## How It Works

```
Discord DM → pavezbot → MCP plugin → Claude Code → executes task → replies via bot
```

The bot only responds when Claude Code is running on Dave's Mac with the Discord channel flag active. The LaunchAgent handles auto-starting this on login.

## LaunchAgent (Auto-start)

**File:** `~/Library/LaunchAgents/com.claude.discord.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude.discord</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/davezabihaylo/.nvm/versions/node/v24.14.0/bin/node</string>
        <string>/Users/davezabihaylo/.nvm/versions/node/v24.14.0/bin/claude</string>
        <string>--yes</string>
        <string>--channels</string>
        <string>plugin:discord@claude-plugins-official</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/Users/davezabihaylo/.nvm/versions/node/v24.14.0/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>/Users/davezabihaylo</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/claude-discord.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/claude-discord-error.log</string>
</dict>
</plist>
```

## Startup & Operations

### Check if running
```bash
launchctl list | grep com.claude
```
- PID number in first column = running
- `-` in first column = not running (check exit code in third column)

### Start manually
```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude.discord.plist
```

### Stop
```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.claude.discord.plist
```

### Restart
```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.claude.discord.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude.discord.plist
```

### View logs
```bash
cat /tmp/claude-discord.log       # stdout
cat /tmp/claude-discord-error.log # stderr / errors
```

### Fallback: run manually in terminal
```bash
claude --yes --channels plugin:discord@claude-plugins-official
```

## Using It

DM pavezbot on Discord. Talk to it like you'd talk to Claude Code normally. Examples:

- `what files are in the repo?`
- `run the tests`
- `push the latest changes to main`
- `what's broken in the build?`

Attach files to your message and Claude will download and work with them.

## Access Control

Access is managed via `~/.claude/channels/discord/access.json`. Current mode: pairing (Dave's account is paired and allowed).

To lock down further (allowlist only, no new pairings):
```
/discord:access policy allowlist
```

To add another Discord user:
```
/discord:access pair <code>   # after they DM the bot and get a code
```

## Security Notes

- **Never share the bot token in chat or commit it.** It lives only in `~/.claude/channels/discord/.env`.
- If the token is ever exposed, reset it immediately: Discord Developer Portal → your app → Bot → Reset Token → update `~/.claude/channels/discord/.env`.
- The `--yes` flag auto-approves Claude Code tool confirmations. This is intentional for autonomous operation but means Claude will execute commands without prompting.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Bot doesn't reply | LaunchAgent not running | `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude.discord.plist` |
| "...is typing" but no reply | Claude Code auth issue or crash | Check error log; try manual start in terminal |
| Exit code 127 in launchctl | Node/claude binary not found | Verify PATH in plist matches `which node` and `which claude` |
| `--print` errors in log | Flag conflict with `--dangerously-skip-permissions` | Use `--yes` instead (already fixed in current plist) |
| Token errors | Token regenerated but .env not updated | Write new token to `~/.claude/channels/discord/.env` |
| Mac asleep / lid closed | No auto-wake | Must be awake; consider Energy Saver settings |

## Recreating from Scratch

If the LaunchAgent plist is ever lost, recreate it:

```bash
cat > ~/Library/LaunchAgents/com.claude.discord.plist << 'EOF'
# paste plist from above
EOF
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude.discord.plist
```

Token is already in `~/.claude/channels/discord/.env` — no need to reconfigure unless it was reset.

## Discord Developer Portal

- App: [discord.com/developers/applications](https://discord.com/developers/applications)
- Client ID: `1487156478484938955`
- Required intents: Message Content Intent (enabled)
- Bot invite URL: `https://discord.com/oauth2/authorize?client_id=1487156478484938955&permissions=274878032960&integration_type=0&scope=bot`
