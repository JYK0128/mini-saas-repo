import { isRedirect } from '@tanstack/react-router';
import { AxiosError, type AxiosResponse } from 'axios';
import { toast } from 'sonner';

import type { BaseResponse } from '@/api/model';

/**
 * Type guard to check if an error is an AxiosError with BaseResponse data
 */
export const isApiError = (error: unknown): error is AxiosError<BaseResponse> => {
  const res = (error as AxiosError<BaseResponse>).response;
  return !res?.data?.success;
};

/**
 * Type guard to check if a response is a successful BaseResponse
 * Handles both full AxiosResponse and peeled data wrapper.
 */
export const isApiSuccess = (data: unknown): data is (BaseResponse | AxiosResponse<BaseResponse>) => {
  if (!data) return false;

  // If it's a full AxiosResponse
  if (typeof data === 'object' && data !== null && 'config' in data && 'data' in data) {
    return (data as AxiosResponse<BaseResponse>).data?.success === true;
  }

  // If it's already peeled data
  return (data as BaseResponse).success === true;
};

/**
 * Extracts all error details from an API error
 */
export const getApiErrorList = (error: unknown) => {
  if (isApiError(error)) {
    return error.response?.data?.errors || [];
  }
  return [];
};

/**
 * Finds a specific error detail by its field name (only for VALIDATION_ERROR)
 */
export const getApiError = (error: unknown, field: string) => {
  return getApiErrorList(error).find((e) => e.field === field);
};

/**
 * Checks if the API error has a specific error code
 */
export const hasApiError = (error: unknown, code: string | string[]) => {
  if (!isApiError(error)) return false;
  const errorCode = error.response?.data?.code || '';
  const codes = Array.isArray(code) ? code : [code];
  return codes.includes(errorCode);
};

/**
 * Extracts the first error message from the API response, with fallbacks
 */
export const getApiErrorMessage = (error: unknown) => {
  if (isRedirect(error)) return;

  if (isApiError(error) && error.response?.data?.message) {
    return error.response.data.message;
  }

  const errors = getApiErrorList(error);
  if (errors.length > 0) {
    return errors[0].reason;
  }

  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  return '요청 처리 중 오류가 발생했습니다.';
};

export const toastApiSuccess = (data: unknown) => {
  if (!isApiSuccess(data)) return;

  const message = ('data' in data && typeof data.data === 'object' && data.data !== null && 'message' in data.data) 
    ? (data.data as BaseResponse).message 
    : (data as BaseResponse).message;

  if (message) {
    toast.success(message, { id: 1 });
  }
  else {
    toast.success('성공적으로 처리되었습니다.', { id: 1 });
  }
};

export const toastApiError = (error: unknown) => {
  if (isRedirect(error)) {
    return;
  }

  const message = getApiErrorMessage(error);
  if (message) {
    toast.error(message, { id: 1 });
  }
};
