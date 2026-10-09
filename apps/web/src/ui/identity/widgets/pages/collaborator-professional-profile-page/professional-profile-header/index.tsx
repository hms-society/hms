import type { CollaboratorProfessionalProfile } from '@hms/core/identity/domain/structures'

import { CollaboratorAvatar } from '@/ui/identity/widgets/components/collaborator-avatar'

export type ProfessionalProfileHeaderProps = {
  profile: CollaboratorProfessionalProfile
  getProfileLabel: (profile: string) => string
}

export const ProfessionalProfileHeader = ({
  profile,
  getProfileLabel,
}: ProfessionalProfileHeaderProps) => (
  <section className='flex flex-col gap-5 rounded-2xl bg-primary px-6 py-5 text-primary-foreground shadow-sm sm:flex-row sm:items-center'>
    <CollaboratorAvatar
      name={profile.professionalName}
      colorSeed={profile.collaboratorId}
      className='size-16 shrink-0 text-xl'
    />
    <div className='min-w-0'>
      <h1 id='professional-profile-title' className='font-serif text-2xl font-semibold'>
        {profile.professionalName}
      </h1>
      <p className='mt-1 text-sm text-primary-foreground/80'>
        {getProfileLabel(profile.profile)}
      </p>
    </div>
  </section>
)
