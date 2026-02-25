cask "passlocal" do
  version "1.2.0"
  sha256 "214060da3e48542bc9815f1e140e1838ce12fc9cc46800e647d50a0e5a6fcd5c"

  url "https://github.com/kirananil007/homebrew-passlocal/releases/download/v#{version}/PassLocal_#{version}_aarch64.dmg"

  name "PassLocal"
  desc "Local password manager for macOS with AES-256 encryption"
  homepage "https://github.com/kirananil007/homebrew-passlocal"

  app "PassLocal.app"

  zap trash: [
    "~/.passlocal",
  ]

  caveats <<~EOS
    PassLocal stores your encrypted vault at ~/.passlocal/vault.enc

    Your master password is never stored - keep it safe!
    If you forget it, your secrets cannot be recovered.
  EOS
end
