# CodeBox

CodeBox is an all-in-one manager for installing, managing, and launching coding/AI CLI tools on Termux. 

CodeBox supports tools such as:
- Claude Code
- OpenAI Codex CLI
- Google Gemini CLI
- Antigravity CLI
- OpenCode
- Codebuff

## Installation

Via npm:
\`\`\`bash
npm install -g codebox
\`\`\`

Bootstrap script:
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/MythroniX24/CodeBox/main/install.sh | bash
\`\`\`

## Usage

Start the interactive dashboard:
\`\`\`bash
codebox
\`\`\`

Use the CLI directly:
\`\`\`bash
codebox list
codebox install claude
codebox uninstall codebuff
codebox open gemini
codebox doctor
\`\`\`

## Features

- **No Server**: Completely local manager without accounts, logins, or cloud sync.
- **Dependency Resolution**: Automatically installs and checks Termux dependencies (Node.js, Python, Git, etc.).
- **Mobile UI**: A clean interactive command-line interface optimized for Android phone screens.
- **Project Manager**: Manage recent projects directly from the interface.

## License

MIT License
