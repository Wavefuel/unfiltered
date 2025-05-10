import { Type } from '@sinclair/typebox'
import addFormats from 'ajv-formats'
import Ajv from 'ajv'

// Create and configure Ajv instance
const ajv = addFormats(
    new Ajv({
        allErrors: true,    // Show all errors, not just the first one
        verbose: true,      // Include more detailed error messages
        strict: true,       // Enforce strict validation
        validateFormats: true // Enable format validation
    }),
    [
        'date-time',
        'time',
        'date',
        'email',
        'hostname',
        'ipv4',
        'ipv6',
        'uri',
        'uri-reference',
        'uuid',
        'uri-template',
        'json-pointer',
        'relative-json-pointer',
        'regex',
        'iso-time',
        'iso-date-time',
        'duration',
        'byte',
        'int32',
        'int64',
        'float',
        'double',
        'password',
        'binary'
    ]
)

// Define the TypeCheck interface
interface TypeCheck<T> {
    Check: (value: unknown) => value is T
    Errors: (value: unknown) => string[]
}

// Create a TypeBox validator that uses Ajv
export class TypeCompiler {
    static compile<T>(schema: any): TypeCheck<T> {
        const validate = ajv.compile(schema)
        return {
            Check: (value: unknown): value is T => validate(value),
            Errors: (value: unknown): string[] => {
                validate(value)
                return validate.errors
                    ? validate.errors.map(error =>
                        `${error.instancePath} ${error.message}`).filter(Boolean)
                    : []
            }
        }
    }
}