/** @format */

import type {
  PasteTableColumnRule,
  PasteTableDataType,
  CellValidationResult,
} from './types';

export function isValidDataType(value: any): value is PasteTableDataType {
  return (
    value === 'alphabet' ||
    value === 'numeric' ||
    value === 'alphanumeric' ||
    value === 'email'
  );
}

export function containsUnsafePattern(value: string): boolean {
  return /<|>|javascript:|vbscript:|data:text\/html|on\w+\s*=|<script|<img|<svg|<iframe|&lt;|&gt;/i.test(
    value,
  );
}

export function getDataTypeLabel(dataType: PasteTableDataType): string {
  if (dataType === 'alphabet') return 'Alphabet';
  if (dataType === 'numeric') return 'Numeric';
  if (dataType === 'alphanumeric') return 'Alphabet and Numeric';
  return 'Email';
}

export function matchesDataType(
  value: string,
  dataType: PasteTableDataType,
): boolean {
  const alphabetRegex = /^[A-Za-z\s''-]+$/;
  const numericRegex = /^\d+(\.\d{1,2})?$/;
  const alphaNumericRegex = /^[A-Za-z0-9\s''-]+$/;
  const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

  if (dataType === 'alphabet') {
    return alphabetRegex.test(value);
  }

  if (dataType === 'numeric') {
    return numericRegex.test(value);
  }

  if (dataType === 'alphanumeric') {
    return alphaNumericRegex.test(value);
  }

  return emailRegex.test(value);
}

/**
 * Security patterns should trigger hard-clear behavior.
 * Business-rule mismatches should not.
 */
export function validateCellValue(
  value: string,
  rule: PasteTableColumnRule,
  mode: 'paste' | 'manual',
): CellValidationResult {
  const trimmedValue = value == null ? '' : String(value);

  if (trimmedValue === '') {
    return { isValid: true, message: '', severity: 'none' };
  }

  if (containsUnsafePattern(trimmedValue)) {
    return {
      isValid: false,
      severity: 'security',
      message:
        mode === 'paste'
          ? `"${rule.header}" contains characters that aren't supported.`
          : `"${rule.header}" contains characters that aren't supported.`,
    };
  }

  if (trimmedValue.length > rule.maxChars) {
    return {
      isValid: false,
      severity: 'business',
      message:
        mode === 'paste'
          ? ` "${rule.header}"  can be no longer than ${rule.maxChars} characters.`
          : ` "${rule.header}"  can be no longer than ${rule.maxChars} characters.`,
    };
  }

  if (!matchesDataType(trimmedValue, rule.dataType)) {
    return {
      isValid: false,
      severity: 'business',
      message:
        mode === 'paste'
          ? `"${rule.header}"  must be a (${getDataTypeLabel(rule.dataType)}).`
          : `"${rule.header}"  must be a (${getDataTypeLabel(rule.dataType)}).`,
    };
  }

  return { isValid: true, message: '', severity: 'none' };
}
