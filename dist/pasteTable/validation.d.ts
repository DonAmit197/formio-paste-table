/** @format */
import type { PasteTableColumnRule, PasteTableDataType, CellValidationResult } from './types';
export declare function isValidDataType(value: any): value is PasteTableDataType;
export declare function containsUnsafePattern(value: string): boolean;
export declare function getDataTypeLabel(dataType: PasteTableDataType): string;
export declare function matchesDataType(value: string, dataType: PasteTableDataType): boolean;
/**
 * Security patterns should trigger hard-clear behavior.
 * Business-rule mismatches should not.
 */
export declare function validateCellValue(value: string, rule: PasteTableColumnRule, mode: 'paste' | 'manual'): CellValidationResult;
