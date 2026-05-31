import ansis from 'ansis';

export const BRAND_HEX = '#87CEEB';

/** 256-color grays — readable on light and dark terminals (matches skills CLI). */
export const GRAY_SCALE = [250, 248, 245, 243, 240, 238] as const;
const DIM_GRAY = 102;
const TEXT_GRAY = 145;

function useColor(): boolean {
  return !process.env.NO_COLOR && ansis.isSupported();
}

export function gray256(code: number, text: string): string {
  return useColor() ? ansis.fg(code)(text) : text;
}

export function dim256(text: string): string {
  return gray256(DIM_GRAY, text);
}

export function text256(text: string): string {
  return gray256(TEXT_GRAY, text);
}

export function brand(text: string): string {
  return useColor() ? ansis.hex(BRAND_HEX)(text) : text;
}

export function success(text: string): string {
  return useColor() ? ansis.green(text) : text;
}

export function muted(text: string): string {
  return useColor() ? ansis.dim(text) : text;
}

export function stripAnsi(text: string): string {
  return ansis.strip(text);
}
