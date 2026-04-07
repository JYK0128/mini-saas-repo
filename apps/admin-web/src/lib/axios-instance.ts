import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

export const AXIOS_INSTANCE = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000',
  withCredentials: true,
});

export const axiosInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token,
  }).then(({ data }: AxiosResponse<T>) => data); // Peel off ONLY the axios.data wrapper

  // @ts-expect-error cancel is not in promise type
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export default axiosInstance;

export type ErrorType<Error> = AxiosError<Error>;
