/** @format */
export declare const pasteTableEditForm: {
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
