import { useEffect } from 'react'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Badge } from '@/ui/shadcn/badge'

interface QualificationSectionProps {
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
}

const STORAGE_KEY_PREFIX = 'extra_client_fields_'

export function QualificationSection(props: QualificationSectionProps) {
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
      if (draft.birthDate !== undefined && draft.birthDate !== '')
        setBirthDate(draft.birthDate)
      if (draft.maritalStatus !== undefined && draft.maritalStatus !== '')
        setMaritalStatus(draft.maritalStatus)
      if (draft.nationality !== undefined && draft.nationality !== '')
        setNationality(draft.nationality)
      if (draft.profession !== undefined && draft.profession !== '')
        setProfession(draft.profession)

      if (draft.stateRegistration !== undefined && draft.stateRegistration !== '')
        setStateRegistration(draft.stateRegistration)
      if (draft.constitutionDate !== undefined && draft.constitutionDate !== '')
        setConstitutionDate(draft.constitutionDate)
      if (draft.legalNature !== undefined && draft.legalNature !== '')
        setLegalNature(draft.legalNature)
      if (draft.legalRepresentative !== undefined && draft.legalRepresentative !== '')
        setLegalRepresentative(draft.legalRepresentative)
      if (draft.representativeRole !== undefined && draft.representativeRole !== '')
        setRepresentativeRole(draft.representativeRole)
    } catch (e) {
      console.error('Erro ao restaurar campos extras:', e)
    }
  }, [storageKey])

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
    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-bold text-slate-800 flex items-center gap-2 font-serif'>
          <Icon name='user' className='w-4 h-4 text-teal-800' /> Qualificação da Pessoa
        </h2>
        <Icon name='chevron-up' className='w-4 h-4 text-slate-400 cursor-pointer' />
      </div>

      <div className='bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2'>
        <Icon name='triangle-alert' className='w-4 h-4 text-emerald-600 shrink-0' />
        Dados iniciais pré-preenchidos a partir do Intake. Complemente conforme a demanda.
      </div>

      <div className='space-y-1'>
        <label className='text-xs font-medium text-slate-700'>Tipo de pessoa</label>
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
                <label className='text-xs font-medium text-slate-700'>
                  Nome completo
                </label>
                <Input
                  value={props.fullName}
                  onChange={(e) => props.setFullName(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>CPF</label>
                <Input
                  value={props.cpf}
                  onChange={(e) => props.setCpf(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Telefone principal
                </label>
                <Input
                  value={props.phone}
                  onChange={(e) => props.setPhone(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='text-xs font-medium text-slate-700'>E-mail</label>
                <Input
                  value={props.email}
                  onChange={(e) => props.setEmail(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>Origem</label>
                <Input
                  value={props.origin}
                  readOnly
                  className='mt-1 h-9 rounded-xl text-xs bg-slate-50 text-slate-700 cursor-not-allowed'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Responsável HMS
                </label>
                <Input
                  value={props.hmsResponsible}
                  onChange={(e) => props.setHmsResponsible(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
            </div>

            {props.linkedThirdParty && (
              <div className='max-w-xs'>
                <label className='text-xs font-medium text-slate-700'>
                  Terceiro vinculado
                </label>
                <Input
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
              <Badge className='bg-emerald-100/70 text-emerald-800 text-[10px] border-none font-medium px-2 py-0.5 rounded-full'>
                Pessoa Física
              </Badge>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='text-xs font-medium text-slate-700'>RG</label>
                <Input
                  value={rg}
                  maxLength={12}
                  onChange={(e) => setRg(formatRG(e.target.value))}
                  placeholder='00.000.000-0'
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Data de nascimento
                </label>
                <Input
                  type='date'
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>Estado civil</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className='mt-1 w-full h-9 rounded-xl border border-[#d4ceca] bg-white text-xs px-3 text-slate-900 font-sans focus:outline-none focus:ring-1 focus:ring-slate-400'
                >
                  <option value=''>—</option>
                  <option value='Solteiro(a)'>Solteiro(a)</option>
                  <option value='Casado(a)'>Casado(a)</option>
                  <option value='Divorciado(a)'>Divorciado(a)</option>
                  <option value='Viúvo(a)'>Viúvo(a)</option>
                </select>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Nacionalidade
                </label>
                <Input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>Profissão</label>
                <Input
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
              <Badge className='bg-amber-100 text-amber-800 text-[10px] border-none font-medium px-2 py-0.5 rounded-full'>
                Pessoa Jurídica
              </Badge>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Razão social{' '}
                </label>
                <Input
                  value={props.companyName}
                  onChange={(e) => props.setCompanyName(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>CNPJ </label>
                <Input
                  value={props.cpf}
                  onChange={(e) => props.setCpf(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Nome fantasia
                </label>
                <Input
                  value={props.tradeName}
                  onChange={(e) => props.setTradeName(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Inscrição estadual
                </label>
                <Input
                  value={stateRegistration}
                  onChange={(e) => setStateRegistration(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Data de constituição
                </label>
                <Input
                  type='date'
                  value={constitutionDate}
                  onChange={(e) => setConstitutionDate(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Natureza jurídica
                </label>
                <Input
                  value={legalNature}
                  onChange={(e) => setLegalNature(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Representante legal
                </label>
                <Input
                  value={legalRepresentative}
                  onChange={(e) => setLegalRepresentative(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Cargo do representante
                </label>
                <Input
                  value={representativeRole}
                  onChange={(e) => setRepresentativeRole(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='text-xs font-medium text-slate-700'>
                  Telefone principal
                </label>
                <Input
                  value={props.phone}
                  onChange={(e) => props.setPhone(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>E-mail</label>
                <Input
                  value={props.email}
                  onChange={(e) => props.setEmail(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>Origem</label>
                <Input
                  value={props.origin}
                  readOnly
                  className='mt-1 h-9 rounded-xl text-xs bg-slate-50 text-slate-700'
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
              <label className='text-xs font-medium text-slate-700'>CEP</label>
              <Input
                value={props.cep}
                onChange={(e) => props.setCep(e.target.value)}
                className='mt-1 h-9 rounded-xl text-xs'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
              <div className='md:col-span-9'>
                <label className='text-xs font-medium text-slate-700'>Logradouro</label>
                <Input
                  value={props.street}
                  onChange={(e) => props.setStreet(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div className='md:col-span-3'>
                <label className='text-xs font-medium text-slate-700'>Número</label>
                <Input
                  value={props.number}
                  onChange={(e) => props.setNumber(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-xs font-medium text-slate-700'>Complemento</label>
                <Input
                  value={props.complement}
                  onChange={(e) => props.setComplement(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-slate-700'>Bairro</label>
                <Input
                  value={props.neighborhood}
                  onChange={(e) => props.setNeighborhood(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
              <div className='md:col-span-10'>
                <label className='text-xs font-medium text-slate-700'>Cidade</label>
                <Input
                  value={props.city}
                  onChange={(e) => props.setCity(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs'
                />
              </div>
              <div className='md:col-span-2'>
                <label className='text-xs font-medium text-slate-700'>UF</label>
                <Input
                  value={props.uf}
                  onChange={(e) => props.setUf(e.target.value)}
                  className='mt-1 h-9 rounded-xl text-xs uppercase'
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
