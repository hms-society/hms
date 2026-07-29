import axios from 'axios'

import type { AuthSession } from '@hms/core/identity/domain/structures'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import type { RestClient } from '@hms/core/shared/interfaces'
import { request } from './utils'

export const AxiosRestClient = (
  baseUrl?: string,
  getSession?: () => Promise<AuthSession | null>,
  onUnauthorized?: () => Promise<void>,
): RestClient => {
  const client = axios.create({ baseURL: baseUrl })

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
    get<ResponseBody>(url: string) {
      return request<ResponseBody>(client, { method: 'get', url })
    },

    getFile(url) {
      return request<File>(client, { method: 'get', url, responseType: 'blob' })
    },

    post<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(client, { method: 'post', url, data: body })
    },

    postFormData<ResponseBody>(url: string, body: FormData) {
      return request<ResponseBody>(client, { method: 'post', url, data: body })
    },

    patch<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(client, { method: 'patch', url, data: body })
    },

    put<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(client, { method: 'put', url, data: body })
    },

    delete<ResponseBody>(url: string, body?: unknown) {
      return request<ResponseBody>(client, { method: 'delete', url, data: body })
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
