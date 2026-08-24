import { useEffect } from 'react'
import { CollapsibleCard } from '@/ui/shared/widgets/components/collapsible-card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

export type QualificationSectionProps = {
  personType: 'individual' | 'legal'
  setPersonType: (type: 'individual' | 'legal') => void
  fullName: string
  setFullName: (val: string) => void
  cpf: string
  setCpf: (val: string) => void
  rg: string
  setRg: (val: string) => void
  birthDate: string
  setBirthDate: (val: string) => void
  maritalStatus: string
  setMaritalStatus: (val: string) => void
  nationality: string
  setNationality: (val: string) => void
  profession: string
  setProfession: (val: string) => void
  companyName: string
  setCompanyName: (val: string) => void
  tradeName: string
  setTradeName: (val: string) => void
  stateRegistration: string
  setStateRegistration: (val: string) => void
  constitutionDate: string
  setConstitutionDate: (val: string) => void
  legalNature: string
  setLegalNature: (val: string) => void
  legalRepresentative: string
  setLegalRepresentative: (val: string) => void
  representativeRole: string
  setRepresentativeRole: (val: string) => void
  phone: string
  setPhone: (val: string) => void
  email: string
  setEmail: (val: string) => void
  origin: string
  linkedThirdParty: string
  setLinkedThirdParty: (val: string) => void
  hmsResponsible: string
  setHmsResponsible: (val: string) => void
  cep: string
  setCep: (val: string) => void
  street: string
  setStreet: (val: string) => void
  number: string
  setNumber: (val: string) => void
  complement: string
  setComplement: (val: string) => void
  neighborhood: string
  setNeighborhood: (val: string) => void
  city: string
  setCity: (val: string) => void
  uf: string
  setUf: (val: string) => void
  consultationId?: string
  isReadOnly?: boolean
}

const STORAGE_KEY_PREFIX = 'extra_client_fields_'

export const QualificationSection = (props: QualificationSectionProps) => {
  const {
    personType,
    setPersonType,
    rg,
    setRg,
    birthDate,
    setBirthDate,
    maritalStatus,
    setMaritalStatus,
    nationality,
    setNationality,
    profession,
    setProfession,
    stateRegistration,
    setStateRegistration,
    constitutionDate,
    setConstitutionDate,
    legalNature,
    setLegalNature,
    legalRepresentative,
    setLegalRepresentative,
    representativeRole,
    setRepresentativeRole,
    consultationId = 'default',
    isReadOnly = false,
  } = props

  const storageKey = `${STORAGE_KEY_PREFIX}${consultationId}`

  const formatRG = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 12)
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return
      const draft = JSON.parse(saved)

      if (draft.rg !== undefined && draft.rg !== '') setRg(draft.rg)
      if (draft.birthDate !== undefined && draft.birthDate !== '') {
        setBirthDate(draft.birthDate)
      }
      if (draft.maritalStatus !== undefined && draft.maritalStatus !== '') {
        setMaritalStatus(draft.maritalStatus)
      }
      if (draft.nationality !== undefined && draft.nationality !== '') {
        setNationality(draft.nationality)
      }
      if (draft.profession !== undefined && draft.profession !== '') {
        setProfession(draft.profession)
      }

      if (draft.stateRegistration !== undefined && draft.stateRegistration !== '') {
        setStateRegistration(draft.stateRegistration)
      }
      if (draft.constitutionDate !== undefined && draft.constitutionDate !== '') {
        setConstitutionDate(draft.constitutionDate)
      }
      if (draft.legalNature !== undefined && draft.legalNature !== '') {
        setLegalNature(draft.legalNature)
      }
      if (draft.legalRepresentative !== undefined && draft.legalRepresentative !== '') {
        setLegalRepresentative(draft.legalRepresentative)
      }
      if (draft.representativeRole !== undefined && draft.representativeRole !== '') {
        setRepresentativeRole(draft.representativeRole)
      }
    } catch (e) {
      console.error('Erro ao restaurar campos extras:', e)
    }
  }, [
    storageKey,
    setRg,
    setBirthDate,
    setMaritalStatus,
    setNationality,
    setProfession,
    setStateRegistration,
    setConstitutionDate,
    setLegalNature,
    setLegalRepresentative,
    setRepresentativeRole,
  ])

  useEffect(() => {
    const dataToSave = {
      rg,
      birthDate,
      maritalStatus,
      nationality,
      profession,
      stateRegistration,
      constitutionDate,
      legalNature,
      legalRepresentative,
      representativeRole,
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave))
    } catch (e) {
      console.error('Erro ao salvar campos extras:', e)
    }
  }, [
    storageKey,
    rg,
    birthDate,
    maritalStatus,
    nationality,
    profession,
    stateRegistration,
    constitutionDate,
    legalNature,
    legalRepresentative,
    representativeRole,
  ])

  return (
    <CollapsibleCard
      title={
        <h2 className='text-base font-bold text-slate-800 flex items-center gap-2 font-serif'>
          <Icon name='user' className='w-4 h-4 text-teal-800' />
          Qualificação da Pessoa
        </h2>
      }
      contentClassName='space-y-6'
    >
      <fieldset disabled={isReadOnly} className='contents'>
        <div className='space-y-1'>
          <span className='text-xs font-medium text-slate-700'>Tipo de pessoa</span>

          <div className='flex items-center gap-2 max-w-xs bg-slate-100/70 p-1 rounded-xl'>
            <Button
              type='button'
              variant={personType === 'individual' ? 'default' : 'ghost'}
              onClick={() => setPersonType('individual')}
              className={`flex-1 rounded-lg h-8 text-xs font-medium gap-1.5 hover:bg-transparent ${
                personType === 'individual'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200 hover:bg-white'
                  : 'text-slate-500'
              }`}
            >
              <Icon name='user' className='w-3.5 h-3.5 text-slate-500' />
              Pessoa Física
            </Button>

            <Button
              type='button'
              variant={personType === 'legal' ? 'default' : 'ghost'}
              onClick={() => setPersonType('legal')}
              className={`flex-1 rounded-lg h-8 text-xs font-medium gap-1.5 hover:bg-transparent ${
                personType === 'legal'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200 hover:bg-white'
                  : 'text-slate-500'
              }`}
            >
              <Icon name='building' className='w-3.5 h-3.5 text-slate-500' />
              Pessoa Jurídica
            </Button>
          </div>
        </div>

        {personType === 'individual' && (
          <div className='space-y-6'>
            <div className='space-y-4'>
              <span className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                Cadastro base
              </span>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label
                    htmlFor='full-name'
                    className='text-xs font-medium text-slate-700'
                  >
                    Nome completo
                  </label>
                  <Input
                    id='full-name'
                    value={props.fullName}
                    onChange={(e) => props.setFullName(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label htmlFor='cpf' className='text-xs font-medium text-slate-700'>
                    CPF
                  </label>
                  <Input
                    id='cpf'
                    value={props.cpf}
                    onChange={(e) => props.setCpf(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='phone-individual'
                    className='text-xs font-medium text-slate-700'
                  >
                    Telefone principal
                  </label>
                  <Input
                    id='phone-individual'
                    value={props.phone}
                    onChange={(e) => props.setPhone(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label
                    htmlFor='email-individual'
                    className='text-xs font-medium text-slate-700'
                  >
                    E-mail
                  </label>
                  <Input
                    id='email-individual'
                    value={props.email}
                    onChange={(e) => props.setEmail(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='origin-individual'
                    className='text-xs font-medium text-slate-700'
                  >
                    Origem
                  </label>
                  <Input
                    id='origin-individual'
                    value={props.origin}
                    readOnly
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='hms-responsible'
                    className='text-xs font-medium text-slate-700'
                  >
                    Responsável HMS
                  </label>
                  <Input
                    id='hms-responsible'
                    value={props.hmsResponsible}
                    onChange={(e) => props.setHmsResponsible(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>
              </div>

              {props.linkedThirdParty && (
                <div className='max-w-xs'>
                  <label
                    htmlFor='linked-third-party'
                    className='text-xs font-medium text-slate-700'
                  >
                    Terceiro vinculado
                  </label>
                  <Input
                    id='linked-third-party'
                    value={props.linkedThirdParty}
                    onChange={(e) => props.setLinkedThirdParty(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>
              )}
            </div>

            <hr className='border-slate-100' />

            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                  Dados pessoais
                </span>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label htmlFor='rg' className='text-xs font-medium text-slate-700'>
                    RG
                  </label>
                  <Input
                    id='rg'
                    value={rg}
                    maxLength={12}
                    onChange={(e) => setRg(formatRG(e.target.value))}
                    placeholder='00.000.000-0'
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='birth-date'
                    className='text-xs font-medium text-slate-700'
                  >
                    Data de nascimento
                  </label>
                  <Input
                    id='birth-date'
                    type='date'
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='marital-status'
                    className='text-xs font-medium text-slate-700'
                  >
                    Estado civil
                  </label>
                  <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                    <SelectTrigger
                      id='marital-status'
                      className='mt-1 w-full rounded-xl border-[#d4ceca] bg-white text-xs text-slate-900 font-sans'
                      size='sm'
                    >
                      <SelectValue placeholder='—' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Solteiro(a)'>Solteiro(a)</SelectItem>
                      <SelectItem value='Casado(a)'>Casado(a)</SelectItem>
                      <SelectItem value='Divorciado(a)'>Divorciado(a)</SelectItem>
                      <SelectItem value='Viúvo(a)'>Viúvo(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label
                    htmlFor='nationality'
                    className='text-xs font-medium text-slate-700'
                  >
                    Nacionalidade
                  </label>
                  <Input
                    id='nationality'
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='profession'
                    className='text-xs font-medium text-slate-700'
                  >
                    Profissão
                  </label>
                  <Input
                    id='profession'
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {personType === 'legal' && (
          <div className='space-y-6'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                  Dados da empresa
                </span>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label
                    htmlFor='company-name'
                    className='text-xs font-medium text-slate-700'
                  >
                    Razão social
                  </label>
                  <Input
                    id='company-name'
                    value={props.companyName}
                    onChange={(e) => props.setCompanyName(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label htmlFor='cnpj' className='text-xs font-medium text-slate-700'>
                    CNPJ
                  </label>
                  <Input
                    id='cnpj'
                    value={props.cpf}
                    onChange={(e) => props.setCpf(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='trade-name'
                    className='text-xs font-medium text-slate-700'
                  >
                    Nome fantasia
                  </label>
                  <Input
                    id='trade-name'
                    value={props.tradeName}
                    onChange={(e) => props.setTradeName(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label
                    htmlFor='state-registration'
                    className='text-xs font-medium text-slate-700'
                  >
                    Inscrição estadual
                  </label>
                  <Input
                    id='state-registration'
                    value={stateRegistration}
                    onChange={(e) => setStateRegistration(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='constitution-date'
                    className='text-xs font-medium text-slate-700'
                  >
                    Data de constituição
                  </label>
                  <Input
                    id='constitution-date'
                    type='date'
                    value={constitutionDate}
                    onChange={(e) => setConstitutionDate(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='legal-nature'
                    className='text-xs font-medium text-slate-700'
                  >
                    Natureza jurídica
                  </label>
                  <Input
                    id='legal-nature'
                    value={legalNature}
                    onChange={(e) => setLegalNature(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label
                    htmlFor='legal-representative'
                    className='text-xs font-medium text-slate-700'
                  >
                    Representante legal
                  </label>
                  <Input
                    id='legal-representative'
                    value={legalRepresentative}
                    onChange={(e) => setLegalRepresentative(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='representative-role'
                    className='text-xs font-medium text-slate-700'
                  >
                    Cargo do representante
                  </label>
                  <Input
                    id='representative-role'
                    value={representativeRole}
                    onChange={(e) => setRepresentativeRole(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label
                    htmlFor='phone-legal'
                    className='text-xs font-medium text-slate-700'
                  >
                    Telefone principal
                  </label>
                  <Input
                    id='phone-legal'
                    value={props.phone}
                    onChange={(e) => props.setPhone(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='email-legal'
                    className='text-xs font-medium text-slate-700'
                  >
                    E-mail
                  </label>
                  <Input
                    id='email-legal'
                    value={props.email}
                    onChange={(e) => props.setEmail(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='origin-legal'
                    className='text-xs font-medium text-slate-700'
                  >
                    Origem
                  </label>
                  <Input
                    id='origin-legal'
                    value={props.origin}
                    readOnly
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>
              </div>
            </div>

            <hr className='border-slate-100' />

            <div className='space-y-3'>
              <span className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                Endereço da Empresa
              </span>

              <div className='max-w-xs'>
                <label htmlFor='cep' className='text-xs font-medium text-slate-700'>
                  CEP
                </label>
                <Input
                  id='cep'
                  value={props.cep}
                  onChange={(e) => props.setCep(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
                <div className='md:col-span-9'>
                  <label htmlFor='street' className='text-xs font-medium text-slate-700'>
                    Logradouro
                  </label>
                  <Input
                    id='street'
                    value={props.street}
                    onChange={(e) => props.setStreet(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div className='md:col-span-3'>
                  <label htmlFor='number' className='text-xs font-medium text-slate-700'>
                    Número
                  </label>
                  <Input
                    id='number'
                    value={props.number}
                    onChange={(e) => props.setNumber(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label
                    htmlFor='complement'
                    className='text-xs font-medium text-slate-700'
                  >
                    Complemento
                  </label>
                  <Input
                    id='complement'
                    value={props.complement}
                    onChange={(e) => props.setComplement(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div>
                  <label
                    htmlFor='neighborhood'
                    className='text-xs font-medium text-slate-700'
                  >
                    Bairro
                  </label>
                  <Input
                    id='neighborhood'
                    value={props.neighborhood}
                    onChange={(e) => props.setNeighborhood(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
                <div className='md:col-span-10'>
                  <label htmlFor='city' className='text-xs font-medium text-slate-700'>
                    Cidade
                  </label>
                  <Input
                    id='city'
                    value={props.city}
                    onChange={(e) => props.setCity(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs'
                  />
                </div>

                <div className='md:col-span-2'>
                  <label htmlFor='uf' className='text-xs font-medium text-slate-700'>
                    UF
                  </label>
                  <Input
                    id='uf'
                    value={props.uf}
                    onChange={(e) => props.setUf(e.target.value)}
                    className='mt-1 h-9 rounded-xl text-xs uppercase'
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </fieldset>
    </CollapsibleCard>
  )
}
