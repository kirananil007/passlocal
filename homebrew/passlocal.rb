cask "passlocal" do
  version "1.0.0"
  sha256 "3a44a09229c1d238346d249e99e4c952bb364293e0796b6eb7aa1705a29a1563"

  url "https://github.com/kirananil007/passlocal/releases/download/v#{version}/PassLocal_#{version}_aarch64.dmg"

  name "PassLocal"
  desc "Local password manager for macOS with AES-256 encryption"
  homepage "https://github.com/kirananil007/passlocal"

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
