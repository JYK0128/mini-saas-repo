import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { BaseResponse } from '../dto/response.dto';

type SwaggerResponseModel = Type | string | number | boolean;

/**
 * 단일 객체 또는 기본 타입 응답을 위한 데코레이터
 * @param model DTO 클래스 또는 기본 값
 */
export const ApiGenericResponse = <TModel extends SwaggerResponseModel>(
  model: TModel,
) => {
  const isType = typeof model === 'function';
  const extraModels = isType ? [BaseResponse, model] : [BaseResponse];

  return applyDecorators(
    ApiExtraModels(...extraModels),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponse) },
          {
            properties: {
              data: isType
                ? { $ref: getSchemaPath(model) }
                : { type: typeof model, example: model },
            },
            required: ['data'],
          },
        ],
      },
    }),
  );
};

/**
 * 리스트(배열) 응답을 위한 데코레이터
 * @param model DTO 클래스
 */
export const ApiGenericArrayResponse = <TModel extends SwaggerResponseModel>(
  model: TModel,
) => {
  const isType = typeof model === 'function';
  const extraModels = isType ? [BaseResponse, model] : [BaseResponse];

  return applyDecorators(
    ApiExtraModels(...extraModels),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponse) },
          {
            properties: {
              data: {
                type: 'array',
                items: isType
                  ? { $ref: getSchemaPath(model) }
                  : { type: typeof model, example: model },
              },
            },
            required: ['data'],
          },
        ],
      },
    }),
  );
};

/**
 * 페이징 응답을 위한 데코레이터
 * @param model DTO 클래스
 */
export const ApiGenericPaginationResponse = <TModel extends SwaggerResponseModel>(
  model: TModel,
) => {
  const isType = typeof model === 'function';
  const extraModels = isType ? [BaseResponse, model] : [BaseResponse];

  return applyDecorators(
    ApiExtraModels(...extraModels),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponse) },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: isType
                      ? { $ref: getSchemaPath(model) }
                      : { type: typeof model, example: model },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'number', example: 1 },
                      size: { type: 'number', example: 10 },
                      totalElements: { type: 'number', example: 50 },
                      totalPages: { type: 'number', example: 5 },
                    },
                    required: ['page', 'size', 'totalElements', 'totalPages'],
                  },
                },
                required: ['items', 'pagination'],
              },
            },
            required: ['data'],
          },
        ],
      },
    }),
  );
};
