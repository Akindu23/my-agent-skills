import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installCtrlCGuard } from '../../src/lib/keypress-guard.js';

/** A stdin stub with no setRawMode, so emitKeypressEvents is skipped. */
function fakeStdin() {
  return new EventEmitter() as unknown as Parameters<typeof installCtrlCGuard>[0] & EventEmitter;
}

describe('installCtrlCGuard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exits 130 on a Ctrl+C keypress', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stdin = fakeStdin();

    const cleanup = installCtrlCGuard(stdin);
    stdin.emit('keypress', 'c', { ctrl: true, name: 'c' });
    cleanup();

    expect(exit).toHaveBeenCalledWith(130);
  });

  it('ignores keypresses that are not Ctrl+C', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const stdin = fakeStdin();

    const cleanup = installCtrlCGuard(stdin);
    stdin.emit('keypress', 'c', { ctrl: false, name: 'c' });
    stdin.emit('keypress', 'a', { ctrl: true, name: 'a' });
    cleanup();

    expect(exit).not.toHaveBeenCalled();
  });

  it('exits 130 via the SIGINT belt handler', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    const cleanup = installCtrlCGuard(fakeStdin());
    process.emit('SIGINT');
    cleanup();

    expect(exit).toHaveBeenCalledWith(130);
  });

  it('cleanup removes both handlers', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const stdin = fakeStdin();

    const cleanup = installCtrlCGuard(stdin);
    cleanup();

    stdin.emit('keypress', 'c', { ctrl: true, name: 'c' });
    process.emit('SIGINT');

    expect(exit).not.toHaveBeenCalled();
  });
});
