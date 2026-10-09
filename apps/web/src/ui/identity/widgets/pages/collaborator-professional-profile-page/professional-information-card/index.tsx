import type { CollaboratorProfessionalProfile } from '@hms/core/identity/domain/structures'

import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'

export type ProfessionalInformationCardProps = {
  profile: CollaboratorProfessionalProfile
  getProfileLabel: (profile: string) => string
}

export const ProfessionalInformationCard = ({
  profile,
  getProfileLabel,
}: ProfessionalInformationCardProps) => (
  <Card className='border border-border shadow-sm'>
    <CardHeader className='gap-1.5 p-5'>
      <h2 className='font-serif text-xl font-semibold text-foreground'>
        Perfil profissional
      </h2>
      <p className='text-sm text-muted-foreground'>
        Informações profissionais disponíveis para a equipe do caso.
      </p>
    </CardHeader>
    <CardContent className='space-y-4 p-5 pt-0'>
      <div>
        <h3 className='text-sm font-medium text-muted-foreground'>E-mail</h3>
        <p className='break-all text-sm text-foreground'>{profile.email}</p>
      </div>
      <div>
        <h3 className='text-sm font-medium text-muted-foreground'>Perfil</h3>
        <p className='text-sm text-foreground'>{getProfileLabel(profile.profile)}</p>
      </div>
    </CardContent>
  </Card>
)
