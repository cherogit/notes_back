const Ajv = require('ajv').default
const ajv = require('ajv-formats')(new Ajv({useDefaults: true, allErrors: true}))

const noteCreationScheme = {
    $async: true,
    type: 'object',
    properties: {
        title: {
            type: 'string',
            minLength: 5,
            maxLength: 30
        },
        note: {type: 'string'},
        labels: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        publication_date: {
            type: 'string',
            format: 'date'
            // oneOf: [
            //     {
            //         type: 'string',
            //         format: 'date'
            //     },
            //     {
            //         type: 'number'
            //     }
            // ]
        }
    },
    required: ['title', 'note']
}

const loginAndPassword = {
    login: {
        type: 'string',
        minLength: 2,
        maxLength: 16
    },
    password: {
        type: 'string',
        minLength: 3
    }
}

const userRegistrationScheme = {
    $async: true,
    type: 'object',
    properties: {
        ...loginAndPassword,
        userName: {
            type: 'string'
        }
    },
    required: ['login', 'userName', 'password']
}

const userAuthorizationScheme = {
    $async: true,
    type: 'object',
    properties: {
        ...loginAndPassword,
    },
    required: ['login', 'password']
}

exports.noteValidator = ajv.compile(noteCreationScheme)
exports.registrationValidator = ajv.compile(userRegistrationScheme)
exports.authorizationValidator = ajv.compile(userAuthorizationScheme)