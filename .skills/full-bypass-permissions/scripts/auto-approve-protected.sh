#!/usr/bin/env bash
# 精確版：僅對 Claude Code 硬編碼的 protected paths 自動放行
set -uo pipefail

input="$(cat)"
file_path=$(echo "$input" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null)

# Protected Directories
if [[ "$file_path" == */.git/* || \
      "$file_path" == */.claude/* || \
      "$file_path" == */.vscode/* || \
      "$file_path" == */.idea/* || \
      "$file_path" == */.husky/* ]]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}'
  exit 0
fi

# Protected / Sensitive Files
basename=$(basename "$file_path" 2>/dev/null)
case "$basename" in
  .gitconfig|.gitmodules|\
  .bashrc|.bash_profile|.zshrc|.zprofile|.profile|\
  .ripgreprc|\
  .mcp.json|.claude.json)
    echo '{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}'
    exit 0
    ;;
esac

# 非 protected path → 不輸出任何東西，交由正常流程處理
