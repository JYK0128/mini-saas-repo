import { AbstractNamingStrategy } from '@mikro-orm/core';

export class CamelCaseNamingStrategy extends AbstractNamingStrategy {
  classToTableName(entityName: string): string {
    return this.toPascalCase(entityName);
  }

  joinColumnName(propertyName: string): string {
    return (
      this.toCamelCase(propertyName)
      + this.referenceColumnName().charAt(0).toUpperCase()
      + this.referenceColumnName().slice(1)
    );
  }

  joinKeyColumnName(
    entityName: string,
    referencedColumnName?: string,
    _composite = false,
  ): string {
    const name = this.toCamelCase(entityName);
    const refCol = referencedColumnName || this.referenceColumnName();
    return name + refCol.charAt(0).toUpperCase() + refCol.slice(1);
  }

  joinTableName(
    sourceEntity: string,
    targetEntity: string,
    propertyName: string,
  ): string {
    return (
      this.classToTableName(sourceEntity) + this.toPascalCase(propertyName)
    );
  }

  propertyToColumnName(propertyName: string, _object?: boolean): string {
    return this.toCamelCase(propertyName);
  }

  referenceColumnName(): string {
    return 'id';
  }

  private toSnakeCase(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }

  private toCamelCase(name: string): string {
    return name
      .replace(/_([a-z])/g, (_, char) => (char as string).toUpperCase()) // Handle underscores
      .replace(/^[A-Z]/, (char) => char.toLowerCase()); // Lowercase first letter
  }

  private toPascalCase(name: string): string {
    return name
      .replace(/_([a-z])/g, (_, char) => (char as string).toUpperCase()) // Handle underscores
      .replace(/^[a-z]/, (char) => char.toUpperCase()); // Uppercase first letter
  }
}
