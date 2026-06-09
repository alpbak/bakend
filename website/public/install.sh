#!/usr/bin/env sh
set -eu

# Minimal Bakend installer for Linux and macOS.
# Usage: BAKEND_INSTALL_URL=<url> sh install.sh
# Or: sh install.sh (downloads latest GitHub release for detected OS/arch)

REPO="${BAKEND_REPO:-alpbak/bakend}"
INSTALL_DIR="${BAKEND_INSTALL_DIR:-/usr/local/bin}"
BINARY_NAME="bak"

detect_os() {
  case "$(uname -s)" in
    Linux) echo "linux" ;;
    Darwin) echo "darwin" ;;
    *)
      echo "Unsupported OS: $(uname -s)" >&2
      exit 1
      ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) echo "x64" ;;
    aarch64|arm64) echo "arm64" ;;
    *)
      echo "Unsupported architecture: $(uname -m)" >&2
      exit 1
      ;;
  esac
}

download_url() {
  if [ -n "${BAKEND_INSTALL_URL:-}" ]; then
    echo "$BAKEND_INSTALL_URL"
    return
  fi

  os="$(detect_os)"
  arch="$(detect_arch)"
  version="${BAKEND_VERSION:-latest}"

  if [ "$version" = "latest" ]; then
    asset="bakend-latest-${os}-${arch}.tar.gz"
    echo "https://github.com/${REPO}/releases/latest/download/${asset}"
  else
    asset="bakend-v${version}-${os}-${arch}.tar.gz"
    echo "https://github.com/${REPO}/releases/download/v${version}/${asset}"
  fi
}

main() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Install to ${INSTALL_DIR} requires root. Re-run with sudo." >&2
    exit 1
  fi

  tmpdir="$(mktemp -d)"
  trap 'rm -rf "$tmpdir"' EXIT

  url="$(download_url)"
  echo "Downloading from ${url}..."

  curl -fsSL "$url" -o "${tmpdir}/bakend.tar.gz"
  tar -xzf "${tmpdir}/bakend.tar.gz" -C "$tmpdir"

  install -m 755 "${tmpdir}/bak" "${INSTALL_DIR}/${BINARY_NAME}"
  echo "Installed ${INSTALL_DIR}/${BINARY_NAME}"

  if [ -f "${tmpdir}/bakend.json.example" ]; then
    echo "Example config included in archive as bakend.json.example"
  fi

  if [ "${BAKEND_INSTALL_SYSTEMD:-}" = "1" ] && [ -f packaging/systemd/bakend.service ]; then
    install -m 644 packaging/systemd/bakend.service /etc/systemd/system/bakend.service
    systemctl daemon-reload
    echo "Installed systemd unit at /etc/systemd/system/bakend.service"
    echo "Enable with: systemctl enable --now bakend"
  fi

  "${INSTALL_DIR}/${BINARY_NAME}" version
}

main "$@"
