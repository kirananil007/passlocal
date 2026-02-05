# PassLocal

A minimal, local password manager for macOS. Store your secrets securely with AES-256 encryption.

## Features

- **Secure Storage**: Secrets encrypted with AES-256-GCM
- **Master Password**: Protected with Argon2id key derivation
- **Folder Organization**: Organize secrets into Personal, Work, or custom folders
- **Apple Silicon**: Native support for M1, M2, M3, M4 Macs
- **Minimal UI**: Clean, Apple-inspired design with dark mode support
- **Clipboard Integration**: Copy secrets with auto-clear after 30 seconds

## Installation

### Via Homebrew

```bash
brew tap kirananil007/passlocal
brew install --cask passlocal
```

### Manual Installation

1. Download the DMG from [GitHub Releases](https://github.com/kirananil007/passlocal/releases)
2. Open the DMG and drag PassLocal to Applications
3. Launch PassLocal from Applications

## Development

### Prerequisites

- Node.js 20.19+ or 22.12+
- Rust (install via rustup)
- Xcode Command Line Tools

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Project Structure

```
passlocal-app/
├── src/                      # React frontend
│   ├── components/           # UI components
│   ├── lib/                  # API wrappers
│   └── types/                # TypeScript types
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── crypto.rs         # AES-256 encryption
│   │   ├── storage.rs        # Vault storage
│   │   └── commands.rs       # Tauri IPC commands
│   └── Cargo.toml
└── homebrew/                 # Homebrew cask formula
```

## Security

- Master password is never stored, only used to derive the encryption key
- Vault is encrypted at rest using AES-256-GCM
- Key derivation uses Argon2id (memory-hard algorithm)
- Secrets are stored locally at `~/.passlocal/vault.enc`

## License

MIT
