import { ValidationError } from 'class-validator';
import { ErrorDetail } from './app.exception';

const childPath = (parent: string, property: string) => {
  if (parent === '') return property;
  return /^\d+$/.test(property) ? `${parent}[${property}]` : `${parent}.${property}`;
};

export const flattenValidationErrors = (errors: ValidationError[], parent = ''): ErrorDetail[] =>
  errors.flatMap((error) => {
    const path = childPath(parent, error.property);
    const own = Object.values(error.constraints ?? {}).map((message) => ({ path, message }));
    return [...own, ...flattenValidationErrors(error.children ?? [], path)];
  });
