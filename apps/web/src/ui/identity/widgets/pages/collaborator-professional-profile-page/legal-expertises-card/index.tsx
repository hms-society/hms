import type { CollaboratorProfessionalProfile } from '@hms/core/identity/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'

export type LegalExpertisesCardProps = {
  profile: CollaboratorProfessionalProfile
}

export const LegalExpertisesCard = ({ profile }: LegalExpertisesCardProps) => (
  <Card className='border border-border shadow-sm'>
    <CardHeader className='gap-1.5 p-5'>
      <h2 className='font-serif text-xl font-semibold text-foreground'>
        Especialidades jurídicas
      </h2>
      <p className='text-sm text-muted-foreground'>
        Áreas e temas profissionais cadastrados.
      </p>
    </CardHeader>
    <CardContent className='space-y-4 p-5 pt-0'>
      {profile.legalExpertises.length > 0 ? (
        profile.legalExpertises.map((expertise) => (
          <section
            key={expertise.legalArea.id}
            className='rounded-lg border border-border bg-card p-4'
          >
            <h3 className='text-sm font-medium text-foreground'>
              {expertise.legalArea.name}
            </h3>
            <div className='mt-2 flex flex-wrap gap-2'>
              {expertise.legalTopics.map((topic) => (
                <Badge key={topic.id} variant='secondary' className='rounded-full'>
                  {topic.name}
                </Badge>
              ))}
            </div>
          </section>
        ))
      ) : (
        <p className='text-sm text-muted-foreground'>
          Nenhuma especialidade jurídica cadastrada.
        </p>
      )}
    </CardContent>
  </Card>
)
