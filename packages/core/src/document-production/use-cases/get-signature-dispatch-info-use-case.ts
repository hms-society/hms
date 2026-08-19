import type { UseCase } from '../../shared/interfaces/use-case'
import { NotFoundError } from '../../shared/domain/errors/not-found-error'
import type { DocumentPackagesRepository } from '../interfaces/document-packages-repository'
import type { SignatureDispatchInfo } from '../domain/structures/signature-dispatch-info'

export interface GetSignatureDispatchInfoInput {
  intakeId: string
}

export class GetSignatureDispatchInfoUseCase
  implements UseCase<GetSignatureDispatchInfoInput, SignatureDispatchInfo>
{
  public constructor(
    private readonly documentPackagesRepository: DocumentPackagesRepository,
  ) {}

  public async execute(
    input: GetSignatureDispatchInfoInput,
  ): Promise<SignatureDispatchInfo> {
    const dispatchInfo = await this.documentPackagesRepository.findDispatchInfoByIntakeId(
      input.intakeId,
    )

    if (!dispatchInfo) {
      throw new NotFoundError('Informações de envio não encontradas para este intake.')
    }

    return dispatchInfo
  }
}