cask "passlocal" do
  version "1.1.0"
  sha256 "b83997987f209f3fd12cae2e1663c732e9a2ddbd5e558535f2f4077e8e981d30"

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
