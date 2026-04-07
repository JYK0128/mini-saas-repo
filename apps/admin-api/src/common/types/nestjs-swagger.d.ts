import '@nestjs/swagger';

declare module '@nestjs/swagger/dist/interfaces/open-api-spec.interface' {
  export interface SchemaObject {
    $ref?: string
  }
}
