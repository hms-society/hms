import axios from 'axios'

import type { AuthSession } from '@hms/core/identity/domain/structures'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import type { RestClient, RestRequestOptions } from '@hms/core/shared/interfaces'
import { request } from './utils'

const REST_REQUEST_TIMEOUT_MS = 15_000

function toAxiosRequestOptions(
  options?: RestRequestOptions,
  defaults?: RestRequestOptions,
) {
  const requestOptions = { ...defaults, ...options }

  return {
    ...(requestOptions.credentials === 'include' ? { withCredentials: true } : {}),
    ...(requestOptions.headers
      ? { headers: { ...defaults?.headers, ...requestOptions.headers } }
      : defaults?.headers
        ? { headers: defaults.headers }
        : {}),
  }
}

export const AxiosRestClient = (
  baseUrl?: string,
  getSession?: () => Promise<AuthSession | null>,
  onUnauthorized?: () => Promise<void>,
  defaultRequestOptions?: RestRequestOptions,
): RestClient => {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: REST_REQUEST_TIMEOUT_MS,
  })

  if (getSession) {
    client.interceptors.request.use(async (config) => {
      const session = await getSession()

      if (session) {
        config.headers.Authorization = `Bearer ${session.accessToken}`
      } else {
        config.headers.Authorization = undefined
      }

      return config
    })
  }

  if (onUnauthorized) {
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === HTTP_STATUS_CODE.unauthorized
        ) {
          await onUnauthorized()
        }

        return Promise.reject(error)
      },
    )
  }

  return {
    get<ResponseBody>(url: string, options?: RestRequestOptions) {
      return request<ResponseBody>(client, {
        method: 'get',
        url,
        ...toAxiosRequestOptions(options, defaultRequestOptions),
      })
    },

    getFile(url, options?: RestRequestOptions) {
      return request<Blob>(client, {
        method: 'get',
        url,
        responseType: 'blob',
        ...toAxiosRequestOptions(options, defaultRequestOptions),
      })
    },

    post<ResponseBody>(url: string, body?: unknown, options?: RestRequestOptions) {
      return request<ResponseBody>(client, {
        method: 'post',
        url,
        data: body,
        ...toAxiosRequestOptions(options, defaultRequestOptions),
      })
    },

    postFormData<ResponseBody>(url: string, body: FormData) {
      return request<ResponseBody>(client, {
        method: 'post',
        url,
        data: body,
        ...toAxiosRequestOptions(undefined, defaultRequestOptions),
      })
    },

    patch<ResponseBody>(url: string, body?: unknown, options?: RestRequestOptions) {
      return request<ResponseBody>(client, {
        method: 'patch',
        url,
        data: body,
        ...toAxiosRequestOptions(options, defaultRequestOptions),
      })
    },

    put<ResponseBody>(url: string, body?: unknown, options?: RestRequestOptions) {
      return request<ResponseBody>(client, {
        method: 'put',
        url,
        data: body,
        ...toAxiosRequestOptions(options, defaultRequestOptions),
      })
    },

    delete<ResponseBody>(url: string, body?: unknown, options?: RestRequestOptions) {
      return request<ResponseBody>(client, {
        method: 'delete',
        url,
        data: body,
        ...toAxiosRequestOptions(options, defaultRequestOptions),
      })
    },

    setBaseUrl(url) {
      client.defaults.baseURL = url
    },

    setHeader(key, value) {
      client.defaults.headers.common[key] = value
    },

    setAuthorization(token) {
      client.defaults.headers.common.Authorization = `Bearer ${token}`
    },

    setQueryParam(key, value) {
      const params = (client.defaults.params ?? {}) as Record<string, string | string[]>

      client.defaults.params = {
        ...params,
        [key]: value,
      }
    },

    clearQueryParams() {
      client.defaults.params = {}
    },
  }
}
