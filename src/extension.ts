import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const CONFIG_KEY = 'faah-error-alert';

let lastTriggerAt = 0;
let isPlaying = false;
let diagnosticTimer: NodeJS.Timeout | undefined;
let hadErrorPreviously = false;
let extensionPath = '';
let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {

    output = vscode.window.createOutputChannel('Faah Error Alert');
    extensionPath = context.extensionPath;

    // Capture initial error state
    hadErrorPreviously = hasAnyError();

    // ================= EDITOR ERROR LISTENER (BATCH + STATE SAFE) =================

    const diagnosticListener = vscode.languages.onDidChangeDiagnostics(() => {

        if (!config().get<boolean>('onErrors', true)) return;

        if (diagnosticTimer) {
            clearTimeout(diagnosticTimer);
        }

        diagnosticTimer = setTimeout(() => {

            const hasErrorNow = hasAnyError();

            // Trigger ONLY when transitioning from no-error → error
            if (!hadErrorPreviously && hasErrorNow) {
                triggerAlert('Editor Error');
            }

            hadErrorPreviously = hasErrorNow;

        }, 300);
    });

    // ================= TERMINAL FAILURE LISTENER =================

    const terminalListener = vscode.window.onDidEndTerminalShellExecution(async (e) => {

        const enabled = config().get<boolean>('onTerminalError', true);
        if (!enabled) return;

        if (e.exitCode !== undefined && e.exitCode !== 0) {
            const commandName = e.execution.commandLine.value || 'Command';
            await triggerAlert(`Terminal Failure: ${commandName}`);
        }
    });

    // ================= MANUAL COMMAND =================

    const playNow = vscode.commands.registerCommand(
        'faah-error-alert.playNow',
        () => triggerAlert('Manual Trigger')
    );

    context.subscriptions.push(
        output,
        diagnosticListener,
        terminalListener,
        playNow
    );
}

// ================= CORE LOGIC =================

async function triggerAlert(reason: string): Promise<void> {

    if (isPlaying) return;

    const now = Date.now();
    const cooldownMs = config().get<number>('cooldownMs', 2500);

    if (now - lastTriggerAt < cooldownMs) return;

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

    setTimeout(() => {
        isPlaying = false;
    }, 700);
}

// ================= ERROR CHECK =================

function hasAnyError(): boolean {
    return vscode.languages
        .getDiagnostics()
        .flatMap(([_, d]) => d)
        .some(d => d.severity === vscode.DiagnosticSeverity.Error);
}

// ================= AUDIO PLAYBACK =================

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

function config() {
    return vscode.workspace.getConfiguration(CONFIG_KEY);
}

function log(message: string) {
    if (output) {
        output.appendLine(`[${new Date().toLocaleTimeString()}] ${message}`);
    }
}

export function deactivate() {}