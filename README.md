# 🔊 Kya Cheda Sound

**"Kya cheda bsdk!"** — The only motivation you'll ever need.

Tired of silently failing? This extension ensures that every time you make a coding mistake or a terminal command fails, you hear about it. Literally.

---

## ✨ Features

- **Editor Errors**: Plays sound the moment a new red squiggly line (Error Diagnostic) appears in your code.
- **Terminal Failures**: Detects when a terminal command exits with an error (non-zero exit code) using VS Code Shell Integration.
- **Background Playback**: On Windows, it uses native PowerShell APIs to play sounds silently without opening external media players.
- **Fallback Speech**: If the audio file is missing or broken, it uses Text-to-Speech (TTS) to keep the insults coming.
- **Cooldown Logic**: Smart cooldown prevents the sound from spamming while you are typing rapidly.

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