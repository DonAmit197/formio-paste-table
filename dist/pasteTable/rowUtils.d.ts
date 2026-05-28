/** @format */
import type { PasteTableValue, PasteTableColumnRule } from './types';
export declare function parseClipboard(text: string): string[][];
export declare function createBlankRow(headers: string[]): Record<string, string>;
export declare function mapRowObjectToArray(rowObj: Record<string, any>, headers: string[]): string[];
export declare function mapRowArrayToObject(row: string[], headers: string[]): Record<string, string>;
export declare function getRuleByHeader(header: string, rules: PasteTableColumnRule[]): PasteTableColumnRule | null;
export declare function isCompleteRowArray(row: string[]): boolean;
export declare function isPartiallyFilledRowArray(row: string[]): boolean;
export declare function getEnteredRowsFromValue(value: PasteTableValue): string[][];
