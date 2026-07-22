import { emitKeypressEvents } from 'node:readline';

interface KeyInfo {
  ctrl?: boolean;
  name?: string;
}

interface KeypressSource {
  on(event: 'keypress', listener: (str: string, key: KeyInfo | undefined) => void): void;
  off(event: 'keypress', listener: (str: string, key: KeyInfo | undefined) => void): void;
  setRawMode?: (mode: boolean) => void;
}

/**
 * Install a session-global Ctrl+C guard around the interactive hub.
 *
 * Clack sets raw mode during a prompt, so `\x03` is delivered as a keypress
 * rather than raised as SIGINT — the keypress listener catches `Ctrl+C` there
 * and exits 130 before Clack resolves its cancel symbol. A SIGINT handler is a
 * belt for the non-raw windows between prompts. Returns a cleanup function that
 * removes both.
 */
export function installCtrlCGuard(stdin: KeypressSource = process.stdin): () => void {
  if (typeof stdin.setRawMode === 'function') {
    emitKeypressEvents(stdin as NodeJS.ReadStream);
  }

  const hardQuit = (): void => {
    process.stdout.write('\nCancelled.\n');
    process.exit(130);
  };

  const onKeypress = (_str: string, key: KeyInfo | undefined): void => {
    if (key?.ctrl && key.name === 'c') {
      hardQuit();
    }
  };
  const onSigint = (): void => {
    hardQuit();
  };

  stdin.on('keypress', onKeypress);
  process.on('SIGINT', onSigint);

  return (): void => {
    stdin.off('keypress', onKeypress);
    process.off('SIGINT', onSigint);
  };
}
