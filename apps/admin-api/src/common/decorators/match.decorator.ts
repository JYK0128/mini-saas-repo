import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

export const MATCH = 'match';

/**
 * Checks if value matches related value.
 */
export function match(value: unknown, relatedValue: unknown): boolean {
  return value === relatedValue;
}

@ValidatorConstraint({ name: MATCH })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as string[];
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
    return match(value, relatedValue);
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as string[];
    return `${args.property} and ${relatedPropertyName} do not match`;
  }
}

export function Match<T extends object>(property: keyof T, validationOptions?: ValidationOptions) {
  return (object: T, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}
