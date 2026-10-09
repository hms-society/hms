import { DetailsState } from '../collaborator-details-page/details-state'
import { useCollaboratorProfessionalProfilePage } from './use-collaborator-professional-profile-page'
import { LegalExpertisesCard } from './legal-expertises-card'
import { ProfessionalInformationCard } from './professional-information-card'
import { ProfessionalProfileHeader } from './professional-profile-header'

export type CollaboratorProfessionalProfilePageProps = {
  collaboratorId: string
}

export const CollaboratorProfessionalProfilePage = ({
  collaboratorId,
}: CollaboratorProfessionalProfilePageProps) => {
  const profilePage = useCollaboratorProfessionalProfilePage(collaboratorId)

  if (profilePage.isLoadingProfessionalProfile) {
    return <DetailsState message='Carregando perfil profissional...' />
  }

  if (profilePage.professionalProfileError || !profilePage.professionalProfile) {
    return (
      <DetailsState
        actionLabel='Tentar novamente'
        message='Não foi possível carregar o perfil profissional.'
        onAction={() => void profilePage.refetchProfessionalProfile()}
      />
    )
  }

  return (
    <main
      className='mx-auto w-full space-y-6'
      aria-labelledby='professional-profile-title'
    >
      <ProfessionalProfileHeader
        profile={profilePage.professionalProfile}
        getProfileLabel={profilePage.getProfileLabel}
      />
      <section className='grid gap-5 xl:grid-cols-2'>
        <ProfessionalInformationCard
          profile={profilePage.professionalProfile}
          getProfileLabel={profilePage.getProfileLabel}
        />
        <LegalExpertisesCard profile={profilePage.professionalProfile} />
      </section>
    </main>
  )
}
