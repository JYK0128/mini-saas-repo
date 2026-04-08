import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const url = import.meta.env.VITE_API_URL as string 
|| 'http://localhost:3000';

export const AXIOS_INSTANCE = axios.create({
  baseURL: `${url}/api`,
  withCredentials: true,
});

export const axiosInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token,
  }).then(({ data }: AxiosResponse<T>) => data);

  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export default axiosInstance;

export type ErrorType<Error> = AxiosError<Error>;
