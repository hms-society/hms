import { Inject, Injectable } from '@nestjs/common'
import { DRIZZLE, type DrizzleDB } from '../database.provider'
import { parametroSistema } from '../schema'

@Injectable()
export class ParametroSistemaSeed {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async run() {
    await this.db
      .insert(parametroSistema)
      .values([
        {
          chave: 'SEGURANCA_LOGIN_MAX_TENTATIVAS',
          valorJson: { valor: 5 },
          descricao:
            'Quantidade máxima de tentativas consecutivas de login antes do bloqueio temporário',
          categoria: 'SEGURANCA',
        },
        {
          chave: 'SEGURANCA_LOGIN_TEMPO_BLOQUEIO_MINUTOS',
          valorJson: { valor: 15 },
          descricao:
            'Tempo em minutos que o usuário permanece bloqueado após exeder as tentativas de login',
          categoria: 'SEGURANCA',
        },
        {
          chave: 'SEGURANCA_SESSAO_TEMPO_INATIVIDADE_MINUTOS',
          valorJson: { valor: 20 },
          descricao:
            'Tempo máximo de inatividade da sessão antes do encerramento automático',
          categoria: 'SEGURANCA',
        },
      ])
      .onConflictDoNothing()
  }
}
