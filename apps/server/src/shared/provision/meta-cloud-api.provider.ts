import { Injectable, Logger } from '@nestjs/common'
import { EnvProvider } from './env/env-provider'
import { AppError } from '@hms/core/shared/domain/errors'
import type {
  MetaCloudApiClient,
  MetaTokenExchangeResult,
  MetaPhoneNumberDetailsResult,
} from '@hms/core/communication/interfaces'

@Injectable()
export class MetaCloudApiProvider implements MetaCloudApiClient {
  private readonly logger = new Logger(MetaCloudApiProvider.name)

  constructor(private readonly envProvider: EnvProvider) {}

  async exchangeCodeForToken(code: string): Promise<MetaTokenExchangeResult> {
    const appId = this.envProvider.get('META_APP_ID')
    const appSecret = this.envProvider.get('META_APP_SECRET')

    if (!appId.trim() || !appSecret.trim()) {
      throw new AppError(
        'META_APP_ID e META_APP_SECRET devem estar configurados para autenticar com a Meta.',
        'WabaRegistrationFailedError',
      )
    }

    const url = new URL(
      `${this.envProvider.get('META_GRAPH_API_BASE_URL')}/oauth/access_token`,
    )
    url.searchParams.append('client_id', appId)
    url.searchParams.append('client_secret', appSecret)
    url.searchParams.append('code', code)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.logger.error(
          `[MetaCloudApiProvider] OAuth code exchange failed (${response.status}): ${errorText}`,
        )
        throw new AppError(
          'Falha ao autenticar com a Meta Graph API. Verifique o código de autorização.',
          'WabaRegistrationFailedError',
        )
      }

      const data = (await response.json()) as {
        access_token?: string
        token_type?: string
      }

      if (!data.access_token) {
        throw new AppError(
          'Resposta da Meta API não contém access_token válido.',
          'WabaRegistrationFailedError',
        )
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type ?? 'bearer',
      }
    } catch (err) {
      if (err instanceof AppError) throw err
      this.logger.error(`[MetaCloudApiProvider] Exception during token exchange: ${err}`)
      throw new AppError(
        'Erro ao conectar com a Meta Graph API.',
        'WabaRegistrationFailedError',
      )
    }
  }

  async getPhoneNumberDetails(
    phoneNumberId: string,
    accessToken: string,
  ): Promise<MetaPhoneNumberDetailsResult> {
    const url = `${this.envProvider.get('META_GRAPH_API_BASE_URL')}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.logger.error(
          `[MetaCloudApiProvider] Get phone number details failed (${response.status}): ${errorText}`,
        )
        throw new AppError(
          'Falha ao consultar detalhes do número de telefone na Meta.',
          'WabaRegistrationFailedError',
        )
      }

      const data = (await response.json()) as {
        display_phone_number?: string
        verified_name?: string
        quality_rating?: string
      }

      return {
        displayPhoneNumber: data.display_phone_number ?? '+5500000000000',
        verifiedName: data.verified_name ?? 'Advogado HMS',
        qualityRating: (data.quality_rating as 'GREEN' | 'YELLOW' | 'RED') ?? 'GREEN',
      }
    } catch (err) {
      if (err instanceof AppError) throw err
      throw err
    }
  }
}
