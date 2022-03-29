export const OPERATORS = {
    'string': ["=", "contains"],
    'number': [">", "<", "="],
    'balance': [">", "<", "="],
    'enum': ["="]
}

export const FIELD_OPS = [
    { label: "=", value: "eq" },
    { label: ">", value: "gt" },
    { label: ">=", value: "gte" },
    { label: "<", value: "ls" },
    { label: "<=", value: "lte" },
    { label: "!=", value: "neq" },
    { label: "contains", value: "like" },
];

export const TOKEN_TYPES = [
    "Renewable Energy Certificate",
    "Carbon Emissions Offset",
    "Audited Emissions",
    "Carbon Tracker"
  ];

export const BALANCE_FIELDS = [
{
    alias: 'Token Type',
    name: 'tokenTypeId',
    type: 'enum'
},
{
    alias: 'Balance',
    name: 'available',
    type: 'balance'
},
{
    alias: 'Retired',
    name: 'retired',
    type: 'balance'
},
{
    alias: 'Transferred',
    name: 'transferred',
    type: 'balance'
},
{
    alias: 'Scope',
    name: 'scope',
    type: 'number'
},
{
    alias: 'Type',
    name: 'type',
    type: 'string'
},
]

export const TOKEN_FIELDS = [
{
    alias: 'Token Type',
    name: 'tokenTypeId',
    type: 'enum'
},
{
    alias: 'Total Issued',
    name: 'totalIssued',
    type: 'balance'
},
{
    alias: 'Total Retired',
    name: 'totalRetired',
    type: 'balance'
},
{
    alias: 'Transferred',
    name: 'transferred',
    type: 'balance'
},
{
    alias: 'Scope',
    name: 'scope',
    type: 'number'
},
{
    alias: 'Type',
    name: 'type',
    type: 'string'
},
]