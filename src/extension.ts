import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const CONFIG_KEY = 'kya-cheda-bsdk-Sound';
let lastTriggerAt = 0;
let lastErrorCount = 0;
let extensionPath = "";
let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
    output = vscode.window.createOutputChannel('Kya cheda bsdk Sound');
    extensionPath = context.extensionPath;
    lastErrorCount = countTotalErrors();

    // 1. LISTEN FOR EDITOR ERRORS (Diagnostics)
    const diagnosticListener = vscode.languages.onDidChangeDiagnostics(() => {
        if (!config().get<boolean>('onErrors', true)) return;
        const currentErrors = countTotalErrors();
        if (currentErrors > lastErrorCount) {
            triggerFaaaa('New Editor Error');
        }
        lastErrorCount = currentErrors;
    });

    // 2. LISTEN FOR TERMINAL ERRORS (All Terminal Commands)
    const terminalListener = vscode.window.onDidEndTerminalShellExecution(async (e) => {
        const terminalEnabled = config().get<boolean>('onTerminalError', true);
        if (!terminalEnabled) return;

        // e.exitCode !== 0 means the command failed
        if (e.exitCode !== undefined && e.exitCode !== 0) {
            const commandName = e.execution.commandLine.value || 'Command';
            await triggerFaaaa(`Terminal Failure: ${commandName}`);
        }
    });

    // 3. MANUAL COMMANDS
    const playNow = vscode.commands.registerCommand('kya-cheda-bsdk-Sound.playNow', () => triggerFaaaa('Manual Trigger'));
    
    context.subscriptions.push(output, diagnosticListener, terminalListener, playNow);
}

// --- LOGIC FUNCTIONS (The "Brains") ---

async function triggerFaaaa(reason: string): Promise<void> {
    const now = Date.now();
    const cooldownMs = config().get<number>('cooldownMs', 2500);

    if (now - lastTriggerAt < cooldownMs) return;
    lastTriggerAt = now;

    log(`Triggered: ${reason}`);
    const played = await playConfiguredSound();

    // FALLBACK: If file playback fails, use speak()
    if (!played) {
        const phrase = config().get<string>('customPhrase', 'Kya cheda bsdk');
        await speak(phrase);
    }
}

// THE SPEAK FUNCTION (This was likely missing)
function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
        const candidates = process.platform === 'darwin' 
            ? [{ cmd: 'say', args: [text] }] 
            : process.platform === 'win32'
            ? [{ cmd: 'PowerShell', args: ['-Command', `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${text.replace(/'/g, "''")}')`] }]
            : [{ cmd: 'spd-say', args: [text] }];

        runCandidateWithResult(candidates, 0, () => resolve());
    });
}

function playConfiguredSound(): Promise<boolean> {
    const filePath = path.join(extensionPath, 'audio.wav');
    if (!fs.existsSync(filePath)) {
        log(`Sound file missing at: ${filePath}`);
        return Promise.resolve(false);
    }

    return new Promise((resolve) => {
        const candidates = audioCandidatesForPlatform(filePath);
        runCandidateWithResult(candidates, 0, resolve);
    });
}

function audioCandidatesForPlatform(filePath: string) {
    if (process.platform === 'darwin') return [{ cmd: 'afplay', args: [filePath] }];
    if (process.platform === 'win32') {
        return [{
            cmd: 'powershell',
            args: ['-NoProfile', '-Command', `(New-Object System.Media.SoundPlayer '${filePath}').PlaySync();`]
        }];
    }
    return [{ cmd: 'ffplay', args: ['-nodisp', '-autoexit', '-loglevel', 'quiet', filePath] }];
}

function runCandidateWithResult(candidates: any[], index: number, done: (success: boolean) => void): void {
    if (index >= candidates.length) return done(false);
    const child = spawn(candidates[index].cmd, candidates[index].args, { stdio: 'ignore', shell: true });
    child.on('error', () => runCandidateWithResult(candidates, index + 1, done));
    child.on('exit', (code) => code === 0 ? done(true) : runCandidateWithResult(candidates, index + 1, done));
}

function countTotalErrors(): number {
    return vscode.languages.getDiagnostics().reduce((count, [, diagnostics]) => 
        count + diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length, 0);
}

function config() { return vscode.workspace.getConfiguration(CONFIG_KEY); }
function log(msg: string) { if (output) output.appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`); }
export function deactivate() {}