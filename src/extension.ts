import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const CONFIG_KEY = 'faah-error-alert';

let lastTriggerAt = 0;
let lastErrorCount = 0;
let isPlaying = false;
let extensionPath = '';
let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
    output = vscode.window.createOutputChannel('Faah Error Alert');
    extensionPath = context.extensionPath;
    lastErrorCount = countTotalErrors();

    // 1️⃣ Listen for editor errors
    const diagnosticListener = vscode.languages.onDidChangeDiagnostics(() => {
        if (!config().get<boolean>('onErrors', true)) return;

        const currentErrors = countTotalErrors();
        if (currentErrors > lastErrorCount) {
            triggerAlert('New Editor Error');
        }
        lastErrorCount = currentErrors;
    });

    // 2️⃣ Listen for terminal failures
    const terminalListener = vscode.window.onDidEndTerminalShellExecution(async (e) => {
        const enabled = config().get<boolean>('onTerminalError', true);
        if (!enabled) return;

        if (e.exitCode !== undefined && e.exitCode !== 0) {
            const commandName = e.execution.commandLine.value || 'Command';
            await triggerAlert(`Terminal Failure: ${commandName}`);
        }
    });

    // 3️⃣ Manual Command
    const playNow = vscode.commands.registerCommand(
        'faah-error-alert.playNow',
        () => triggerAlert('Manual Trigger')
    );

    context.subscriptions.push(output, diagnosticListener, terminalListener, playNow);
}

// ================= CORE LOGIC =================

async function triggerAlert(reason: string): Promise<void> {

    // Prevent double playing
    if (isPlaying) {
        log('Blocked: already playing');
        return;
    }

    const now = Date.now();
    const cooldownMs = config().get<number>('cooldownMs', 2500);

    // Cooldown protection
    if (now - lastTriggerAt < cooldownMs) {
        log('Blocked: cooldown active');
        return;
    }

    lastTriggerAt = now;
    isPlaying = true;

    log(`Triggered: ${reason}`);

    try {
        const played = await playConfiguredSound();

        if (!played) {
            const phrase = config().get<string>('customPhrase', 'Error detected');
            await speak(phrase);
        }

    } catch (err) {
        log(`Playback error: ${err}`);
    }

    // Unlock after short delay
    setTimeout(() => {
        isPlaying = false;
    }, 700);
}

// ================= AUDIO + SPEECH =================

function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
        const escaped = text.replace(/'/g, "''");

        const candidates =
            process.platform === 'darwin'
                ? [{ cmd: 'say', args: [text] }]
                : process.platform === 'win32'
                ? [{
                    cmd: 'powershell',
                    args: [
                        '-NoProfile',
                        '-Command',
                        `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${escaped}')`
                    ]
                }]
                : [{ cmd: 'spd-say', args: [text] }];

        runCandidate(candidates, 0, () => resolve());
    });
}

function playConfiguredSound(): Promise<boolean> {
    const filePath = path.join(extensionPath, 'audio.wav');

    if (!fs.existsSync(filePath)) {
        log(`Audio file not found: ${filePath}`);
        return Promise.resolve(false);
    }

    return new Promise((resolve) => {
        const candidates = audioCandidates(filePath);
        runCandidate(candidates, 0, resolve);
    });
}

function audioCandidates(filePath: string) {
    if (process.platform === 'darwin') {
        return [{ cmd: 'afplay', args: [filePath] }];
    }

    if (process.platform === 'win32') {
        return [{
            cmd: 'powershell',
            args: [
                '-NoProfile',
                '-Command',
                `(New-Object System.Media.SoundPlayer '${filePath}').PlaySync();`
            ]
        }];
    }

    return [{
        cmd: 'ffplay',
        args: ['-nodisp', '-autoexit', '-loglevel', 'quiet', filePath]
    }];
}

function runCandidate(
    candidates: any[],
    index: number,
    done: (success: boolean) => void
): void {
    if (index >= candidates.length) return done(false);

    const child = spawn(
        candidates[index].cmd,
        candidates[index].args,
        { stdio: 'ignore', shell: true }
    );

    child.on('error', () =>
        runCandidate(candidates, index + 1, done)
    );

    child.on('exit', (code) =>
        code === 0
            ? done(true)
            : runCandidate(candidates, index + 1, done)
    );
}

// ================= HELPERS =================

function countTotalErrors(): number {
    return vscode.languages
        .getDiagnostics()
        .reduce(
            (count, [, diagnostics]) =>
                count +
                diagnostics.filter(
                    d => d.severity === vscode.DiagnosticSeverity.Error
                ).length,
            0
        );
}

function config() {
    return vscode.workspace.getConfiguration(CONFIG_KEY);
}

function log(message: string) {
    if (output) {
        output.appendLine(`[${new Date().toLocaleTimeString()}] ${message}`);
    }
}

export function deactivate() {}