import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ThirdPartyFaker } from '../../domain/entities/fakers'
import type { ThirdPartyPermissionGrant } from '../../domain/entities'
import type {
  ThirdPartiesRepository,
  ThirdPartyAuditLogsRepository,
  ThirdPartyPermissionsRepository,
} from '../../interfaces'
import { GrantThirdPartyPermissionUseCase } from '../grant-third-party-permission-use-case'
import { ListThirdPartyPermissionsUseCase } from '../list-third-party-permissions-use-case'
import { RevokeThirdPartyPermissionUseCase } from '../revoke-third-party-permission-use-case'
import { DeactivateThirdPartyUseCase } from '../deactivate-third-party-use-case'

describe('Third-party permission use cases', () => {
  let thirdPartiesRepository: MockProxy<ThirdPartiesRepository>
  let permissionsRepository: MockProxy<ThirdPartyPermissionsRepository>
  let auditLogsRepository: MockProxy<ThirdPartyAuditLogsRepository>
  const thirdParty = ThirdPartyFaker.fake({ id: 'third-party-1', status: 'active' })

  beforeEach(() => {
    thirdPartiesRepository = mock<ThirdPartiesRepository>()
    permissionsRepository = mock<ThirdPartyPermissionsRepository>()
    auditLogsRepository = mock<ThirdPartyAuditLogsRepository>()
    thirdPartiesRepository.findById.mockResolvedValue(thirdParty)
  })

  it('grants case-status visibility and audits the grant', async () => {
    const grant = grantFixture()
    permissionsRepository.grant.mockResolvedValue(grant)
    const useCase = new GrantThirdPartyPermissionUseCase(
      thirdPartiesRepository,
      permissionsRepository,
      auditLogsRepository,
    )

    await expect(
      useCase.execute({
        actorId: 'user-1',
        actorProfile: 'admin',
        thirdPartyId: thirdParty.id,
        permission: 'view_case_status',
      }),
    ).resolves.toBe(grant)

    expect(permissionsRepository.grant).toHaveBeenCalledWith(
      thirdParty.id,
      'view_case_status',
      'user-1',
    )
    expect(auditLogsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'permission_granted',
        permission: 'view_case_status',
      }),
    )
  })

  it.each([
    'lawyer',
    'attendant',
  ] as const)('rejects permission changes from %s', async (actorProfile) => {
    const useCase = new GrantThirdPartyPermissionUseCase(
      thirdPartiesRepository,
      permissionsRepository,
    )

    await expect(
      useCase.execute({
        actorId: 'user-1',
        actorProfile: actorProfile as 'admin' | 'supervisor',
        thirdPartyId: thirdParty.id,
        permission: 'view_case_status',
      }),
    ).rejects.toThrow('Somente administradores e supervisores')
    expect(permissionsRepository.grant).not.toHaveBeenCalled()
  })

  it('rejects grants for inactive third parties', async () => {
    thirdPartiesRepository.findById.mockResolvedValue(
      ThirdPartyFaker.fake({ id: thirdParty.id, status: 'inactive' }),
    )
    const useCase = new GrantThirdPartyPermissionUseCase(
      thirdPartiesRepository,
      permissionsRepository,
    )

    await expect(
      useCase.execute({
        actorId: 'user-1',
        actorProfile: 'supervisor',
        thirdPartyId: thirdParty.id,
        permission: 'view_intake_status',
      }),
    ).rejects.toThrow('Terceiros inativos')
    expect(permissionsRepository.grant).not.toHaveBeenCalled()
  })

  it('revokes a permission and audits the revocation', async () => {
    const grant = grantFixture({ active: false })
    permissionsRepository.revoke.mockResolvedValue(grant)
    const useCase = new RevokeThirdPartyPermissionUseCase(
      thirdPartiesRepository,
      permissionsRepository,
      auditLogsRepository,
    )

    await expect(
      useCase.execute({
        actorId: 'user-1',
        actorProfile: 'supervisor',
        thirdPartyId: thirdParty.id,
        permission: 'view_intake_status',
      }),
    ).resolves.toBe(grant)

    expect(auditLogsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'permission_revoked',
        permission: 'view_intake_status',
      }),
    )
  })

  it('lists all grants for a third party', async () => {
    const grants = [grantFixture()]
    permissionsRepository.listByThirdPartyId.mockResolvedValue(grants)
    const useCase = new ListThirdPartyPermissionsUseCase(permissionsRepository)

    await expect(useCase.execute({ thirdPartyId: thirdParty.id })).resolves.toBe(grants)
  })

  it('revokes all active permissions when the third party is deactivated', async () => {
    const updated = ThirdPartyFaker.fake({ id: thirdParty.id, status: 'inactive' })
    thirdPartiesRepository.updateStatus.mockResolvedValue(updated)
    const useCase = new DeactivateThirdPartyUseCase(
      thirdPartiesRepository,
      auditLogsRepository,
      permissionsRepository,
    )

    await expect(
      useCase.execute({
        actorId: 'user-1',
        actorProfile: 'admin',
        thirdPartyId: thirdParty.id,
      }),
    ).resolves.toBe(updated)

    expect(permissionsRepository.revokeAll).toHaveBeenCalledWith(thirdParty.id)
  })
})

function grantFixture(
  overrides: Partial<ThirdPartyPermissionGrant> = {},
): ThirdPartyPermissionGrant {
  return {
    id: 'grant-1',
    thirdPartyId: 'third-party-1',
    permission: 'view_case_status',
    active: true,
    grantedBy: 'user-1',
    grantedAt: new Date('2026-09-29T12:00:00.000Z'),
    revokedAt: undefined,
    ...overrides,
  }
}
