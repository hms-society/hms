import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationsRepository,
} from '../../interfaces'
import { GetFormalizationSignatureConfigurationUseCase } from '../get-formalization-signature-configuration-use-case'
import {
  makeConfiguration,
  makeFormalization,
} from './signature-configuration-test-helpers'

describe('Get Formalization Signature Configuration Use Case', () => {
  it('returns the authoritative configuration without writing', async () => {
    const formalization = makeFormalization()
    const configuration = makeConfiguration({ formalizationId: formalization.id })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const configurationRepository = mock<FormalizationSignatureConfigurationRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    configurationRepository.findByFormalizationId.mockResolvedValue(configuration)

    await expect(
      new GetFormalizationSignatureConfigurationUseCase(
        formalizationsRepository,
        configurationRepository,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
      }),
    ).resolves.toBe(configuration)
    expect(configurationRepository.replaceConfiguration).not.toHaveBeenCalled()
  })

  it('reports explicit initialization for a confirmed legacy Formalization', async () => {
    const formalization = makeFormalization()
    const formalizationsRepository = mock<FormalizationsRepository>()
    const configurationRepository = mock<FormalizationSignatureConfigurationRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)

    const result = await new GetFormalizationSignatureConfigurationUseCase(
      formalizationsRepository,
      configurationRepository,
    ).execute({
      formalizationId: formalization.id,
      actorId: formalization.assignedLawyerId,
    })

    expect(result.status).toBe('initialization_required')
    expect(result.readiness.issues[0]?.code).toBe('initialization_required')
  })
})
