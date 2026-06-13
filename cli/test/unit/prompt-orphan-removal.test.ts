import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CliCancel } from '../../src/lib/errors.js';

const mocks = vi.hoisted(() => ({
  cancelSymbol: Symbol('clack:cancel'),
  multiselect: vi.fn(),
  isCancel: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock('@clack/prompts', () => ({
  multiselect: mocks.multiselect,
  isCancel: mocks.isCancel,
  cancel: mocks.cancel,
}));

const { promptOrphanRemoval } = await import('../../src/lib/prompts.js');

describe('promptOrphanRemoval', () => {
  beforeEach(() => {
    mocks.multiselect.mockReset();
    mocks.isCancel.mockReset();
    mocks.cancel.mockReset();
    mocks.isCancel.mockImplementation((value) => value === mocks.cancelSymbol);
  });

  it('preselects all orphan names and allows deselecting all', async () => {
    mocks.multiselect.mockResolvedValueOnce([]);

    const selected = await promptOrphanRemoval(['ghost', 'stale']);

    expect(selected).toEqual([]);
    expect(mocks.multiselect).toHaveBeenCalledWith({
      message: 'Remove skills no longer in the pack? (deselect to keep)',
      options: [
        { value: 'ghost', label: 'ghost' },
        { value: 'stale', label: 'stale' },
      ],
      initialValues: ['ghost', 'stale'],
      required: false,
    });
  });

  it('throws CliCancel when the prompt is cancelled', async () => {
    mocks.multiselect.mockResolvedValueOnce(mocks.cancelSymbol);

    await expect(promptOrphanRemoval(['ghost'])).rejects.toThrow(CliCancel);
    expect(mocks.cancel).toHaveBeenCalledWith('Cancelled.');
  });
});
