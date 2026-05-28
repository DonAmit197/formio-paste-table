/** @format */

export const pasteTableEditForm = {
  components: [
    {
      type: 'tabs',
      key: 'tabs',
      components: [
        {
          label: 'Display',
          key: 'display',
          components: [
            {
              type: 'textfield',
              key: 'label',
              label: 'Label',
              input: true,
            },
            {
              type: 'textfield',
              key: 'key',
              label: 'Property Name',
              input: true,
            },
            {
              type: 'checkbox',
              key: 'validate.required',
              label: 'Required',
              input: true,
              defaultValue: true,
            },
            {
              type: 'number',
              key: 'maxRows',
              label: 'Maximum number of Rows in the table',
              input: true,
              defaultValue: 10,
              validate: {
                min: 1,
                integer: true,
              },
            },
            {
              type: 'textfield',
              key: 'customMessage',
              label: 'Custom error message',
              input: true,
              defaultValue: 'Add table content to continue.',
            },
            {
              type: 'textarea',
              key: 'userInformation',
              label: 'User Information',
              input: true,
              rows: 3,
            },
            {
              type: 'datagrid',
              key: 'tableHeaders',
              label: 'Table Column Headers',
              input: true,
              addAnother: 'Add Header',
              components: [
                {
                  type: 'textfield',
                  key: 'value',
                  label: 'Header Name',
                  input: true,
                },
                {
                  type: 'number',
                  key: 'maxChars',
                  label: 'Maximum characters allowed',
                  input: true,
                  defaultValue: 20,
                  validate: {
                    min: 1,
                    integer: true,
                  },
                },
                {
                  type: 'select',
                  key: 'dataType',
                  label: 'Data type allowed',
                  input: true,
                  defaultValue: 'alphabet',
                  dataSrc: 'values',
                  data: {
                    values: [
                      { label: 'Alphabet', value: 'alphabet' },
                      { label: 'Numeric', value: 'numeric' },
                      {
                        label: 'Alphabet and Numeric',
                        value: 'alphanumeric',
                      },
                      { label: 'Email', value: 'email' },
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'API',
          key: 'api',
          components: [
            {
              type: 'checkbox',
              key: 'input',
              label: 'Input',
              input: true,
            },
          ],
        },
      ],
    },
  ],
};
