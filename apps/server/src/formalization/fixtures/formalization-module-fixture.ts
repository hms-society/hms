import type { ExecutionContext, INestApplication, Type } from '@nestjs/common'
import type { TestingModuleBuilder } from '@nestjs/testing'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'
import type {
  DocumentPdfConverter,
  FormalizationSignatureConfigurationRepository,
  FormalizationDocumentPdfInspector,
  FormalizationSignatureSourceReader,
} from '@hms/core/formalization/interfaces'
import { fakeFormalization } from '@hms/core/formalization/domain/entities/fakers'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type {
  Broker,
  FileStorageProvider,
  StorageProvider,
} from '@hms/core/shared/interfaces'
import type { EventPayload, InngestFunction } from 'inngest'
import { vi, type Mock, type Mocked } from 'vitest'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { formalizationSignaturePreviewModel } from '@/formalization/database/drizzle/models'
import { FormalizationModule } from '@/formalization/formalization.module'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/inngest-fixture'
import type { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { SupabaseStorageFixture } from '@/shared/provision/storage/supabase-storage-fixture'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

type ConfigureFixture = (builder: TestingModuleBuilder) => TestingModuleBuilder

type InngestJobType<T extends InngestJob> = Type<T> & {
  readonly ID: string
}

type FormalizationModuleFixtureOptions<T extends InngestJob> = {
  readonly configure?: ConfigureFixture
  readonly inngestJob?: InngestJobType<T>
}

type FormalizationRestContext = {
  readonly authUser: AuthUser
  readonly broker: Broker & { publish: Mock }
  readonly collaboratorId: string
  readonly converter: Mocked<DocumentPdfConverter>
  readonly inspector: Mocked<FormalizationDocumentPdfInspector>
  readonly restFixture: RestFixture
  readonly sourceReader: Mocked<FormalizationSignatureSourceReader>
  readonly storageFixture?: SupabaseStorageFixture
}

type SeedSignaturePreviewInput = {
  readonly attemptToken?: string
  readonly documentId?: string
  readonly documentVersionId?: string
  readonly formalizationId?: string
  readonly previewId?: string
}

export class FormalizationModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly inngestFixture: InngestFixture | undefined,
    readonly authUser: AuthUser,
    readonly collaboratorId: string,
    readonly broker: Broker & { publish: Mock },
    readonly idProvider: IdProvider,
    readonly datetimeProvider: DatetimeProvider,
    readonly sourceReader: Mocked<FormalizationSignatureSourceReader>,
    readonly converter: Mocked<DocumentPdfConverter>,
    readonly inspector: Mocked<FormalizationDocumentPdfInspector>,
    private readonly storageFixture: SupabaseStorageFixture | undefined,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  get formalizationsRepository(): FormalizationsRepository {
    return this.restFixture.get(FORMALIZATION_REPOSITORIES.formalizations)
  }

  get signatureConfigurationRepository(): FormalizationSignatureConfigurationRepository {
    return this.restFixture.get(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
  }

  get fileStorageProvider(): FileStorageProvider {
    return this.restFixture.get(PROVISION_PROVIDERS.fileStorage)
  }

  get storageProvider(): StorageProvider {
    return this.restFixture.get(PROVISION_PROVIDERS.storage)
  }

  get inngestFunctionOptions(): InngestFunction.Options {
    if (!this.inngestFixture) {
      throw new Error('The formalization fixture was not registered for Inngest.')
    }

    return this.inngestFixture.functionOptions
  }

  static async register<T extends InngestJob = InngestJob>(
    target?: ConfigureFixture | FormalizationModuleFixtureOptions<T>,
  ) {
    const options: FormalizationModuleFixtureOptions<T> =
      typeof target === 'function' ? { configure: target } : (target ?? {})

    if (options.inngestJob) {
      return FormalizationModuleFixture.registerWithInngest(options, options.inngestJob)
    }

    const context = await FormalizationModuleFixture.registerRestContext(
      options.configure,
    )
    return FormalizationModuleFixture.fromRestContext(context)
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  runInngest(event: EventPayload) {
    if (!this.inngestFixture) {
      throw new Error('The formalization fixture was not registered for Inngest.')
    }

    return this.inngestFixture.run(event)
  }

  invokeInngest(data?: Record<string, unknown>) {
    if (!this.inngestFixture) {
      throw new Error('The formalization fixture was not registered for Inngest.')
    }

    return this.inngestFixture.invoke(data)
  }

  async seedPendingSignaturePreview(input: SeedSignaturePreviewInput = {}) {
    const formalizationId = input.formalizationId ?? this.idProvider.generate()
    const previewId = input.previewId ?? this.idProvider.generate()
    const attemptToken = input.attemptToken ?? this.idProvider.generate()
    const documentId = input.documentId ?? this.idProvider.generate()
    const documentVersionId = input.documentVersionId ?? this.idProvider.generate()
    const now = this.datetimeProvider.now()

    await this.seedFormalization(formalizationId)
    await this.restFixture
      .get(DrizzleClient)
      .requireDatabase()
      .insert(formalizationSignaturePreviewModel)
      .values({
        id: previewId,
        formalizationId,
        documentId,
        documentVersionId,
        state: 'pending',
        attemptsCount: 0,
        attemptToken,
        pages: [],
        createdAt: now,
        updatedAt: now,
      })

    return {
      attemptToken,
      documentId,
      documentVersionId,
      formalizationId,
      previewId,
    }
  }

  async seedCleanupSignaturePreview() {
    const formalizationId = this.idProvider.generate()
    const previewId = this.idProvider.generate()
    const documentId = this.idProvider.generate()
    const documentVersionId = this.idProvider.generate()
    const now = this.datetimeProvider.now()
    const content = new Uint8Array([37, 80, 68, 70])
    const filePath = `formalization/${formalizationId}/cleanup/${previewId}.pdf`

    await this.seedFormalization(formalizationId)
    const file = await this.fileStorageProvider.save({
      filePath,
      fileName: `${previewId}.pdf`,
      contentType: 'application/pdf',
      sizeInBytes: content.byteLength,
      content,
    })
    await this.restFixture
      .get(DrizzleClient)
      .requireDatabase()
      .insert(formalizationSignaturePreviewModel)
      .values({
        id: previewId,
        formalizationId,
        documentId,
        documentVersionId,
        fileId: file.id,
        contentChecksumSha256: 'a'.repeat(64),
        pdfChecksumSha256: 'b'.repeat(64),
        converterVersion: 'fixture-converter',
        pageCount: 1,
        pages: [{ page: 1, width: 595, height: 842 }],
        byteSize: content.byteLength,
        state: 'cleanup_pending',
        attemptsCount: 1,
        createdAt: now,
        updatedAt: now,
      })

    return { file, filePath, previewId }
  }

  async close() {
    const errors: unknown[] = []

    try {
      await this.inngestFixture?.teardown()
    } catch (error) {
      errors.push(error)
    }

    try {
      await this.restFixture.close()
    } catch (error) {
      errors.push(error)
    }

    try {
      await this.storageFixture?.close()
    } catch (error) {
      errors.push(error)
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to close the formalization fixture.')
    }
  }

  private static fromRestContext(
    context: FormalizationRestContext,
    inngestFixture?: InngestFixture,
  ) {
    return new FormalizationModuleFixture(
      context.restFixture,
      inngestFixture,
      context.authUser,
      context.collaboratorId,
      context.broker,
      context.restFixture.get(IdProvider),
      context.restFixture.get(DatetimeProvider),
      context.sourceReader,
      context.converter,
      context.inspector,
      context.storageFixture,
    )
  }

  private async seedFormalization(formalizationId: string) {
    if (await this.formalizationsRepository.findById(formalizationId)) return

    await this.formalizationsRepository.addOrGet(
      fakeFormalization({
        id: formalizationId,
        assignedLawyerId: this.collaboratorId,
      }),
    )
  }

  private static async registerRestContext(
    configure?: ConfigureFixture,
    inngestClient?: InngestClient,
  ): Promise<FormalizationRestContext> {
    const storageFixture = inngestClient
      ? await SupabaseStorageFixture.register()
      : undefined
    const collaboratorId = '91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30'
    const authUser: AuthUser = {
      id: 'a1f9d3e7-8b2c-4d6e-9f10-223344556677',
      email: 'formalization.fixture@hms.test',
    }
    const broker: Broker & { publish: Mock } = { publish: vi.fn() }
    const sourceReader: Mocked<FormalizationSignatureSourceReader> = {
      findPerson: vi.fn().mockResolvedValue(null),
      listEligibleCandidates: vi.fn().mockResolvedValue({
        items: [],
        page: 1,
        limit: 20,
        total: 0,
      }),
      listCurrentDocuments: vi.fn().mockResolvedValue([]),
      findCurrentDocument: vi.fn().mockResolvedValue(null),
      findDocumentVersion: vi.fn().mockResolvedValue(null),
    }
    const converter: Mocked<DocumentPdfConverter> = {
      convert: vi.fn().mockResolvedValue({
        contentType: 'application/pdf',
        content: new Uint8Array([37, 80, 68, 70]),
        converterVersion: 'fixture-converter',
      }),
    }
    const inspector: Mocked<FormalizationDocumentPdfInspector> = {
      inspect: vi.fn().mockResolvedValue({
        pageCount: 1,
        pages: [{ page: 1, width: 595, height: 842 }],
      }),
    }
    let restFixture: RestFixture
    try {
      restFixture = await RestFixture.register(
        {
          imports: [FormalizationModule],
          providers: [
            {
              provide: InngestBroker,
              useValue: broker,
            },
          ],
        },
        (builder) => {
          let configuredBuilder = configure?.(builder) ?? builder

          if (inngestClient) {
            // biome-ignore lint/correctness/useHookAtTopLevel: This is Nest's testing-module builder, not a React hook.
            configuredBuilder = configuredBuilder
              .overrideProvider(InngestClient)
              .useValue(inngestClient)
          }

          if (storageFixture) {
            // biome-ignore lint/correctness/useHookAtTopLevel: This is Nest's testing-module builder, not a React hook.
            configuredBuilder = configuredBuilder
              .overrideProvider(EnvProvider)
              .useValue(storageFixture.envProvider)
          }

          return configuredBuilder
            .overrideProvider(InngestBroker)
            .useValue(broker)
            .overrideProvider(FORMALIZATION_PROVIDERS.signatureSourceReader)
            .useValue(sourceReader)
            .overrideProvider(FORMALIZATION_PROVIDERS.documentPdfConverter)
            .useValue(converter)
            .overrideProvider(FORMALIZATION_PROVIDERS.documentPdfInspector)
            .useValue(inspector)
            .overrideGuard(AuthGuard)
            .useValue({
              canActivate: (context: ExecutionContext) => {
                const request = context.switchToHttp().getRequest<{ user?: AuthUser }>()
                request.user = authUser
                return true
              },
            })
            .overrideGuard(ActiveCollaboratorGuard)
            .useValue({
              canActivate: (context: ExecutionContext) => {
                const request = context
                  .switchToHttp()
                  .getRequest<{ collaborator?: unknown }>()
                request.collaborator = {
                  collaboratorId,
                  professionalName: 'Advogado da fixture',
                  email: authUser.email,
                  profile: 'lawyer',
                  status: 'active',
                  legalExpertises: [],
                }
                return true
              },
            })
        },
      )
    } catch (error) {
      await storageFixture?.close()
      throw error
    }

    return {
      authUser,
      broker,
      collaboratorId,
      converter,
      inspector,
      restFixture,
      sourceReader,
      storageFixture,
    }
  }

  private static async registerWithInngest<T extends InngestJob>(
    options: FormalizationModuleFixtureOptions<T>,
    jobType: InngestJobType<T>,
  ) {
    let context: FormalizationRestContext | undefined
    const inngestFixture = new InngestFixture({
      functionId: jobType.ID,
      createJob: async (client) => {
        context = await FormalizationModuleFixture.registerRestContext(
          options.configure,
          client,
        )
        return context.restFixture.get(jobType)
      },
    })

    try {
      await inngestFixture.setup()
    } catch (error) {
      const errors: unknown[] = [error]

      try {
        await context?.restFixture.close()
      } catch (closeError) {
        errors.push(closeError)
      }

      try {
        await context?.storageFixture?.close()
      } catch (closeError) {
        errors.push(closeError)
      }

      if (errors.length > 1) {
        throw new AggregateError(errors, 'Failed to register the formalization fixture.')
      }
      throw error
    }

    if (!context) {
      await inngestFixture.teardown()
      throw new Error('The formalization fixture was not registered for Inngest.')
    }

    return FormalizationModuleFixture.fromRestContext(context, inngestFixture)
  }
}
