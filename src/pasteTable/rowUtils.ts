/** @format */

import type { PasteTableValue, PasteTableColumnRule } from './types';

export function parseClipboard(text: string): string[][] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => line.split('\t').map((cell) => cell.trim()));
}

export function createBlankRow(headers: string[]): Record<string, string> {
  const row: Record<string, string> = {};

  headers.forEach((header) => {
    row[header] = '';
  });

  return row;
}

export function mapRowObjectToArray(
  rowObj: Record<string, any>,
  headers: string[],
): string[] {
  return headers.map((header) => {
    const value = rowObj[header];
    return value == null ? '' : String(value);
  });
}

export function mapRowArrayToObject(
  row: string[],
  headers: string[],
): Record<string, string> {
  const record: Record<string, string> = {};

  headers.forEach((header, index) => {
    record[header] = row[index] ?? '';
  });

  return record;
}

export function getRuleByHeader(
  header: string,
  rules: PasteTableColumnRule[],
): PasteTableColumnRule | null {
  let i = 0;

  for (i = 0; i < rules.length; i += 1) {
    if (rules[i].header === header) {
      return rules[i];
    }
  }

  return null;
}

export function isCompleteRowArray(row: string[]): boolean {
  if (!row.length) return false;

  let i = 0;
  for (i = 0; i < row.length; i += 1) {
    if (String(row[i] || '').trim() === '') {
      return false;
    }
  }

  return true;
}

export function isPartiallyFilledRowArray(row: string[]): boolean {
  const hasAny = row.some((cell) => String(cell || '').trim() !== '');
  const hasAnyEmpty = row.some((cell) => String(cell || '').trim() === '');

  return hasAny && hasAnyEmpty;
}

export function getEnteredRowsFromValue(value: PasteTableValue): string[][] {
  if (!value || !Array.isArray(value.rows)) {
    return [];
  }

  return value.rows
    .map((row) => {
      if (!Array.isArray(row)) return [];
      return row.map((cell) => {
        return cell == null ? '' : String(cell);
      });
    })
    .filter((row) => row.some((cell) => String(cell).trim() !== ''));
}
