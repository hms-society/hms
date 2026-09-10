import type { RestResponse } from '#shared/responses/rest-response.ts'

export interface RestClient {
  get<ResponseBody>(
    url: string,
    options?: RestRequestOptions,
  ): Promise<RestResponse<ResponseBody>>
  getFile(url: string, options?: RestRequestOptions): Promise<RestResponse<Blob>>
  post<ResponseBody>(
    url: string,
    body?: unknown,
    options?: RestRequestOptions,
  ): Promise<RestResponse<ResponseBody>>
  postFormData<ResponseBody>(
    url: string,
    body: FormData,
  ): Promise<RestResponse<ResponseBody>>
  patch<ResponseBody>(
    url: string,
    body?: unknown,
    options?: RestRequestOptions,
  ): Promise<RestResponse<ResponseBody>>
  put<ResponseBody>(
    url: string,
    body?: unknown,
    options?: RestRequestOptions,
  ): Promise<RestResponse<ResponseBody>>
  delete<ResponseBody>(
    url: string,
    body?: unknown,
    options?: RestRequestOptions,
  ): Promise<RestResponse<ResponseBody>>
  setBaseUrl(url: string): void
  setHeader(key: string, value: string): void
  setAuthorization(token: string): void
  setQueryParam(key: string, value: string | string[]): void
  clearQueryParams(): void
}

export type RestRequestOptions = {
  readonly credentials?: RequestCredentials
  readonly headers?: Readonly<Record<string, string>>
}
