/** @format */
import 'tabulator-tables/dist/css/tabulator.min.css';
type PasteTableValue = {
    headers: string[];
    rows: string[][];
} | null;
type PasteTableRefs = {
    labelEl?: HTMLLabelElement;
    userInfoEl?: HTMLDivElement;
    infoMsg?: HTMLDivElement;
    errorMsg?: HTMLDivElement;
    tabulatorTarget?: HTMLDivElement;
    addRowBtn?: HTMLButtonElement;
    deleteRowBtn?: HTMLButtonElement;
    maxRowMsg?: HTMLDivElement;
    deleteHint?: HTMLDivElement;
};
type PasteTableDataType = 'alphabet' | 'numeric' | 'alphanumeric' | 'email';
type PasteTableHeaderSetting = {
    value?: string;
    maxChars?: number;
    dataType?: PasteTableDataType;
};
type PasteTableSchema = {
    label?: string;
    tableHeaders?: Array<PasteTableHeaderSetting | string>;
    maxRows?: number;
    customMessage?: string;
    userInformation?: string;
    validate?: {
        required?: boolean;
        [key: string]: any;
    };
    disabled?: boolean;
    [key: string]: any;
};
interface BaseComponentInstance {
    component: PasteTableSchema;
    options?: Record<string, any>;
    triggerChange(): void;
    dataValue: unknown;
    loadRefs(element: HTMLElement, refs: Record<string, string>): void;
    render(template: string): string;
    attach(element: HTMLElement): Promise<void> | void;
    detach(): void;
}
declare const PasteTableComponent_base: new (...args: unknown[]) => BaseComponentInstance;
export default class PasteTableComponent extends PasteTableComponent_base implements BaseComponentInstance {
    refs: PasteTableRefs;
    private _table;
    private _tableValue;
    private _isMutatingTable;
    private _isDetached;
    private _initAttemptId;
    private _selectedRow;
    private _lastPointerType;
    private handlePointerUp;
    private handleCaptureClick;
    static schema(...extend: any[]): any;
    static get builderInfo(): {
        title: string;
        icon: string;
        group: string;
        weight: number;
        schema: any;
    };
    static editForm(): {
        components: {
            type: string;
            key: string;
            components: {
                label: string;
                key: string;
                components: ({
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    defaultValue?: undefined;
                    validate?: undefined;
                    rows?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    defaultValue: boolean;
                    validate?: undefined;
                    rows?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    defaultValue: number;
                    validate: {
                        min: number;
                        integer: boolean;
                    };
                    rows?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    defaultValue: string;
                    validate?: undefined;
                    rows?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    rows: number;
                    defaultValue?: undefined;
                    validate?: undefined;
                    addAnother?: undefined;
                    components?: undefined;
                } | {
                    type: string;
                    key: string;
                    label: string;
                    input: boolean;
                    addAnother: string;
                    components: ({
                        type: string;
                        key: string;
                        label: string;
                        input: boolean;
                        defaultValue?: undefined;
                        validate?: undefined;
                        dataSrc?: undefined;
                        data?: undefined;
                    } | {
                        type: string;
                        key: string;
                        label: string;
                        input: boolean;
                        defaultValue: number;
                        validate: {
                            min: number;
                            integer: boolean;
                        };
                        dataSrc?: undefined;
                        data?: undefined;
                    } | {
                        type: string;
                        key: string;
                        label: string;
                        input: boolean;
                        defaultValue: string;
                        dataSrc: string;
                        data: {
                            values: {
                                label: string;
                                value: string;
                            }[];
                        };
                        validate?: undefined;
                    })[];
                    defaultValue?: undefined;
                    validate?: undefined;
                    rows?: undefined;
                })[];
            }[];
        }[];
    };
    get defaultValue(): {
        headers: string[];
        rows: any[];
    } | null;
    private isBuilderPreview;
    private isReadOnlyMode;
    private getMaxRows;
    private getValidationMessage;
    private getUserInformation;
    private getConfiguredColumnRules;
    private isValidDataType;
    render(): string;
    attach(element: HTMLElement): void | Promise<void>;
    detach(): void;
    private handleTableKeyDown;
    private handleDeleteButtonKeyDown;
    private scheduleSafeInit;
    private scheduleSafeHydrate;
    private isTargetReadyForInit;
    isEmpty(value: PasteTableValue): boolean;
    checkValidity(data: any, dirty: boolean, rowData?: any, options?: any, silentCheck?: boolean): any;
    private getComponentValidationMessage;
    private getEnteredRowsFromValue;
    private isCompleteRowArray;
    private isPartiallyFilledRowArray;
    private createBlankRow;
    private parseClipboard;
    private mapRowObjectToArray;
    private mapRowArrayToObject;
    private setStoredValue;
    private syncValueFromTable;
    private normalizeTableRows;
    /**
     * Security patterns should trigger hard-clear behavior.
     * Business-rule mismatches should not.
     */
    private validateCellValue;
    private containsUnsafePattern;
    private getDataTypeLabel;
    private matchesDataType;
    private getRuleByHeader;
    /**
     * Hard clear only for security-level issues.
     */
    private clearComponentToEmpty;
    private createInputEditor;
    private buildRowsFromValue;
    private getInitialTableData;
    private applyStoredValueToTable;
    private initTableFromConfiguredHeaders;
    private handleNativePaste;
    private validatePastedRows;
    private appendRowsFromClipboard;
    private handleRowSelection;
    private handleAddRow;
    private updateAddRowButtonVisibility;
    private clearSelectedRow;
    private handleDeleteRow;
    private updateDeleteRowButtonVisibility;
    private showError;
    private hideError;
    getValue(): PasteTableValue;
    setValue(value: PasteTableValue): boolean;
}
export {};
