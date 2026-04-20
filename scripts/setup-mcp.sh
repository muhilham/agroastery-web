#!/bin/bash
# Setup script to generate MCP config files from .env.local
# This avoids committing sensitive tokens to git
# Supports both OpenCode (.opencode/opencode.json) and Claude Code (.claude/claude.json)

set -e

# Get the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.local"

echo "🔧 Setting up MCP configurations..."

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.local not found at $ENV_FILE"
    echo "   Please copy .env.example to .env.local and add your SUPABASE_MCP_TOKEN"
    exit 1
fi

# Extract SUPABASE_MCP_TOKEN from .env.local
MCP_TOKEN=$(grep -E '^SUPABASE_MCP_TOKEN=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' || true)

if [ -z "$MCP_TOKEN" ]; then
    echo "❌ Error: SUPABASE_MCP_TOKEN not found in $ENV_FILE"
    echo "   Add this line to your .env.local:"
    echo "   SUPABASE_MCP_TOKEN=sbp_your_token_here"
    exit 1
fi

# ─── OpenCode Configuration ─────────────────────────────────────────────────
OPENCODE_DIR="$PROJECT_ROOT/.opencode"
OPENCODE_FILE="$OPENCODE_DIR/opencode.json"

mkdir -p "$OPENCODE_DIR"

cat > "$OPENCODE_FILE" << EOF
{
  "mcp": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer ${MCP_TOKEN}"
      }
    }
  }
}
EOF

chmod 600 "$OPENCODE_FILE"
echo "✅ Generated $OPENCODE_FILE"

# ─── Claude Code Configuration ──────────────────────────────────────────────
CLAUDE_DIR="$PROJECT_ROOT/.claude"
CLAUDE_FILE="$CLAUDE_DIR/claude.json"

mkdir -p "$CLAUDE_DIR"

cat > "$CLAUDE_FILE" << EOF
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp",
      "headers": {
        "Authorization": "Bearer ${MCP_TOKEN}"
      }
    }
  }
}
EOF

chmod 600 "$CLAUDE_FILE"
echo "✅ Generated $CLAUDE_FILE"

echo ""
echo "✨ MCP configurations complete!"
echo "   File permissions set to 600 (readable only by owner)"
echo ""
echo "   Note: Both files are gitignored and will not be committed."
