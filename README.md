# 🔊 Faah Kya Cheda Sound Error Alert

**"Kya cheda  "** — The only motivation you'll ever need.

Tired of silently failing? This extension ensures that every time you make a coding mistake or a terminal command fails, you hear about it. Literally.

---

# Faah Error Alert

A VS Code extension that plays a custom alert sound when code errors or terminal failures occur.

## Features
- 🔴 Plays sound on editor errors
- 🖥 Plays sound on terminal command failure
- 🔁 Cooldown to prevent spam
- 🔊 Custom audio support
---

## 🚀 Installation

1. Open **VS Code**.
2. Go to the **Extensions** view (`Ctrl+Shift+X`).
3. Search for **Kya Cheda Sound**.
4. Click **Install**.

> **Note**: For terminal sounds to work, ensure **Shell Integration** is enabled in your VS Code settings. You should see a small dot (blue/red) next to your terminal commands.

---

## ⚙️ Configuration

Customize the behavior in `Settings > Extensions > Kya cheda bsdk Sound`:

| Setting | Default | Description |
| :--- | :--- | :--- |
| `onErrors` | `true` | Enable sound when code errors appear in the editor. |
| `onTerminalError` | `true` | Enable sound when a terminal command fails. |
| `cooldownMs` | `2500` | Minimum delay (ms) between sounds. |
| `soundFilePath` | `${extensionPath}/audio.wav` | Path to a custom `.wav` file if you want to swap the voice. |

---

## 🛠️ Commands

Open the Command Palette (`Ctrl+Shift+P`) and search for:

- `Kya cheda bsdk Sound: Play Now` - Test the sound immediately.

---

## 📝 Requirements

- **Windows**: No extra software needed (uses PowerShell).
- **macOS**: No extra software needed (uses `afplay`).
- **Linux**: Requires `ffplay` (from FFmpeg) or `aplay` installed.

---

## 🤝 Contributing

Found a bug or want to add more features? Feel free to check out the [GitHub Repository](https://github.com/Utkarshrajmishra).

---
**Enjoying the motivation? Leave a ⭐ on the Marketplace!**