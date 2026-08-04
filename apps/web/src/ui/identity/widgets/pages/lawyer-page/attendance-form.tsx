import { useState } from 'react'
import {
  ArrowLeft,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  User,
  Tag,
  Building2,
  FileText,
  Clock,
  Scale,
  FileClock,
  Edit2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
} from 'lucide-react'

import { Textarea } from '@/ui/shadcn/textarea'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Badge } from '@/ui/shadcn/badge'

import { AddFactDialog } from './add-fact'
import { SelectFormDialog } from './select-form'

interface TimelineFact {
  id: string
  date: string
  description: string
  status: string
  isSuggested?: boolean
}

interface LegalClaim {
  id: string
  title: string
  summary: string
  isSuggested?: boolean
}

interface AttendanceFormProps {
  onBack?: () => void
}

export function AttendanceForm({ onBack }: AttendanceFormProps) {
  const [isFactModalOpen, setIsFactModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  // Tipo de Pessoa
  const [personType, setPersonType] = useState<'individual' | 'legal'>('individual')

  // Cadastro Base
  const [fullName, setFullName] = useState('Ricardo Alves de Souza')
  const [cpf, setCpf] = useState('123.456.789-00')
  const [phone, setPhone] = useState('(12) 99876-3322')
  const [email, setEmail] = useState('ricardo.alves@gmail.com')
  const [origin, setOrigin] = useState('Via terceiro')
  const [linkedThirdParty, setLinkedThirdParty] = useState('Sindicato Metalúrgicos SJC')
  const [hmsResponsible, setHmsResponsible] = useState('Adv. Epaminondas')

  // Dados Pessoa Física
  const [rg, setRg] = useState('32.456.789-2')
  const [birthDate, setBirthDate] = useState('15/03/1985')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [nationality, setNationality] = useState('')
  const [profession, setProfession] = useState('')

  // Dados Pessoa Jurídica
  const [companyName, setCompanyName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [stateRegistration, setStateRegistration] = useState('')
  const [constitutionDate, setConstitutionDate] = useState('')
  const [legalNature, setLegalNature] = useState('')
  const [legalRepresentative, setLegalRepresentative] = useState('')
  const [representativeRole, setRepresentativeRole] = useState('')

  // Endereço (PJ)
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('São José dos Campos')
  const [uf, setUf] = useState('SP')

  // Área e Tema
  const [legalArea, setLegalArea] = useState('Trabalhista')
  const [legalTheme, setLegalTheme] = useState('Verbas rescisórias')
  const [selectedFormName, setSelectedFormName] = useState('Triagem trabalhista inicial')

  // Cronologia
  const [facts, setFacts] = useState<TimelineFact[]>([
    { id: '1', date: '10/01/2018', description: 'Admissão na Metalúrgica São José como Operador de Produção', status: 'Comprovado' },
    { id: '2', date: '2020–2026', description: 'Horas extras habituais sem registro em cartão de ponto', status: 'A comprovar' },
    { id: '3', date: '20/03/2026', description: 'Alegação de agressão verbal por supervisor direto', status: 'A comprovar', isSuggested: true },
    { id: '4', date: '05/05/2026', description: 'Demissão sem justa causa comunicada verbalmente', status: 'Comprovado' },
  ])

  // Pedidos
  const [claims, setClaims] = useState<LegalClaim[]>([
    {
      id: '1',
      title: 'Aviso prévio indenizado',
      summary: 'Art. 487, §1º da CLT — na ausência de aviso prévio pelo empregador na demissão sem justa causa, a indenização substitutiva é devida.',
    },
    { id: '2', title: 'Saldo de salário', summary: '' },
    { id: '3', title: '13º proporcional', summary: '', isSuggested: true },
    { id: '4', title: 'Férias + 1/3', summary: '', isSuggested: true },
  ])

  const [lawyerNotes, setLawyerNotes] = useState('')
  const [mainLegalQuestion, setMainLegalQuestion] = useState('Quais verbas rescisórias são devidas diante do encerramento do vínculo sem pagamento integral?')
  const [clientGuidance, setClientGuidance] = useState('')
  const [viability, setViability] = useState('Viável')
  const [decision, setDecision] = useState('Prosseguir para contratação')

  const handleAddFact = (newFact: { date: string; description: string; status: string }) => {
    setFacts((prev) => [...prev, { id: crypto.randomUUID(), ...newFact }])
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Botão Voltar (Redireciona para Detalhes) */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-teal-800 hover:text-teal-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
      </div>

      {/* SEÇÃO 1: QUALIFICAÇÃO DA PESSOA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
            <User className="w-4 h-4 text-teal-800" /> Qualificação da Pessoa
          </h2>
          <ChevronUp className="w-4 h-4 text-slate-400 cursor-pointer" />
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          Dados iniciais pré-preenchidos a partir do Intake. Complemente conforme a demanda.
        </div>

        {/* Cadastro Base */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cadastro base
          </span>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Tipo de pessoa *</label>
            <div className="flex items-center gap-2 max-w-xs bg-slate-100/70 p-1 rounded-xl">
              <Button
                type="button"
                variant={personType === 'individual' ? 'default' : 'ghost'}
                onClick={() => setPersonType('individual')}
                className={`flex-1 rounded-lg h-8 text-xs font-medium gap-1.5 transition-all ${
                  personType === 'individual'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                Pessoa Física
              </Button>
              <Button
                type="button"
                variant={personType === 'legal' ? 'default' : 'ghost'}
                onClick={() => setPersonType('legal')}
                className={`flex-1 rounded-lg h-8 text-xs font-medium gap-1.5 transition-all ${
                  personType === 'legal'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Pessoa Jurídica
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Nome completo *</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 h-9 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">CPF *</label>
              <Input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="mt-1 h-9 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Telefone principal *</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700">E-mail</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-9 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Origem *</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-700"
              >
                <option value="Via terceiro">Via terceiro</option>
                <option value="Direto">Direto</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Terceiro vinculado *</label>
              <select
                value={linkedThirdParty}
                onChange={(e) => setLinkedThirdParty(e.target.value)}
                className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-700"
              >
                <option value="Sindicato Metalúrgicos SJC">Sindicato Metalúrgicos SJC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Responsável HMS *</label>
            <Input
              value={hmsResponsible}
              onChange={(e) => setHmsResponsible(e.target.value)}
              className="mt-1 h-9 rounded-xl text-xs"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* PESSOA FÍSICA - EXIBIÇÃO CONDICIONAL */}
        {personType === 'individual' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dados pessoais
              </span>
              <Badge className="bg-emerald-100/70 text-emerald-800 text-[10px] border-none font-medium px-2 py-0.5 rounded-full">
                Pessoa Física
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">RG</label>
                <Input
                  value={rg}
                  onChange={(e) => setRg(e.target.value)}
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Data de nascimento</label>
                <Input
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Estado civil</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 text-slate-700"
                >
                  <option value="">—</option>
                  <option value="Solteiro(a)">Solteiro(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Viúvo(a)">Viúvo(a)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Nacionalidade</label>
                <Input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="—"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Profissão</label>
              <Input
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="—"
                className="mt-1 h-9 rounded-xl text-xs"
              />
            </div>
          </div>
        )}

        {/* PESSOA JURÍDICA - EXIBIÇÃO CONDICIONAL */}
        {personType === 'legal' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dados da empresa
              </span>
              <Badge className="bg-amber-100 text-amber-800 text-[10px] border-none font-medium px-2 py-0.5 rounded-full">
                Pessoa Jurídica
              </Badge>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-xs text-amber-800 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              Seção exibida quando Tipo Pessoa = Pessoa Jurídica
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Razão social</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="—"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Nome fantasia</label>
                <Input
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="—"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Inscrição estadual</label>
                <Input
                  value={stateRegistration}
                  onChange={(e) => setStateRegistration(e.target.value)}
                  placeholder="—"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Data de constituição</label>
                <Input
                  value={constitutionDate}
                  onChange={(e) => setConstitutionDate(e.target.value)}
                  placeholder="—"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Natureza jurídica</label>
                <Input
                  value={legalNature}
                  onChange={(e) => setLegalNature(e.target.value)}
                  placeholder="—"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Representante legal</label>
                <Input
                  value={legalRepresentative}
                  onChange={(e) => setLegalRepresentative(e.target.value)}
                  placeholder="—"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Cargo do representante</label>
                <Input
                  value={representativeRole}
                  onChange={(e) => setRepresentativeRole(e.target.value)}
                  placeholder="—"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <hr className="border-slate-100 my-2" />

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Endereço
              </span>

              <div className="max-w-xs">
                <label className="text-xs font-medium text-slate-700">CEP</label>
                <Input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="—"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-9">
                  <label className="text-xs font-medium text-slate-700">Logradouro</label>
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="—"
                    className="mt-1 h-9 rounded-xl text-xs"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-slate-700">Número</label>
                  <Input
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="—"
                    className="mt-1 h-9 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700">Complemento</label>
                  <Input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="—"
                    className="mt-1 h-9 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Bairro</label>
                  <Input
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="—"
                    className="mt-1 h-9 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-10">
                  <label className="text-xs font-medium text-slate-700">Cidade</label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-700">UF</label>
                  <Input
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className="mt-1 h-9 rounded-xl text-xs uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: ÁREA E TEMA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
          <Tag className="w-4 h-4 text-teal-800" /> Área e Tema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-700">Área jurídica *</label>
            <select
              value={legalArea}
              onChange={(e) => setLegalArea(e.target.value)}
              className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 font-medium text-slate-700"
            >
              <option>Trabalhista</option>
              <option>Previdenciário</option>
              <option>Cível</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Tema jurídico *</label>
            <select
              value={legalTheme}
              onChange={(e) => setLegalTheme(e.target.value)}
              className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white text-xs px-3 font-medium text-slate-700"
            >
              <option>Verbas rescisórias</option>
              <option>Aposentadoria por idade</option>
            </select>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: FICHA SELECIONADA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
            <FileText className="w-4 h-4 text-teal-800" /> Ficha de atendimento
          </h2>
          <Button
            variant="outline"
            onClick={() => setIsFormModalOpen(true)}
            className="rounded-full text-xs h-8 px-4 border-slate-200 text-teal-800 hover:bg-teal-50"
          >
            Trocar ficha
          </Button>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800">{selectedFormName}</p>
            <p className="text-[11px] text-slate-500">{legalArea} · {legalTheme}</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: FATOS RELEVANTES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
            <Clock className="w-4 h-4 text-teal-800" /> Fatos relevantes e cronologia
          </h2>
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </div>

        <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
          {facts.map((fact) => (
            <div key={fact.id} className="flex items-center justify-between p-3 text-xs bg-white hover:bg-slate-50">
              <span className="font-medium text-slate-600 w-24 shrink-0">{fact.date}</span>
              <p className="text-slate-800 flex-1 px-3">{fact.description}</p>
              <div className="flex items-center gap-2">
                {fact.isSuggested && (
                  <Badge className="bg-purple-100 text-purple-800 text-[10px] border-none font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Sugerido
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600">
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFacts(facts.filter((f) => f.id !== fact.id))}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsFactModalOpen(true)}
          className="text-xs text-teal-700 font-medium hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar fato manualmente
        </button>
      </div>

      {/* SEÇÃO 5: PEDIDOS JURÍDICOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
            <Scale className="w-4 h-4 text-teal-800" /> Possíveis pedidos jurídicos
          </h2>
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </div>

        <div className="space-y-2">
          {claims.map((claim) => (
            <div key={claim.id} className="p-3 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{claim.title}</span>
                <div className="flex items-center gap-1.5">
                  {claim.isSuggested && (
                    <Badge className="bg-purple-100 text-purple-800 text-[10px] border-none font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Sugerido
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {claim.summary && <p className="text-[11px] text-slate-500">{claim.summary}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 6: NOTAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
          <FileText className="w-4 h-4 text-teal-800" /> Notas do advogado
        </h2>
        <Textarea
          value={lawyerNotes}
          onChange={(e) => setLawyerNotes(e.target.value)}
          placeholder="Opcional — anotações adicionais..."
          className="min-h-[80px] rounded-xl text-xs bg-slate-50/50"
        />
      </div>

      {/* SEÇÃO 7: CONCLUSÃO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
          <Scale className="w-4 h-4 text-teal-800" /> Conclusão da consulta
        </h2>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">Questão jurídica principal</label>
          <Input
            value={mainLegalQuestion}
            onChange={(e) => setMainLegalQuestion(e.target.value)}
            className="h-9 rounded-xl text-xs"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">Orientação prestada ao cliente</label>
          <Textarea
            value={clientGuidance}
            onChange={(e) => setClientGuidance(e.target.value)}
            placeholder="Registre o que foi orientado..."
            className="min-h-[70px] rounded-xl text-xs bg-slate-50/50"
          />
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Viabilidade Jurídica</label>
            <div className="flex flex-wrap gap-2">
              {['Viável', 'Viável com ressalvas', 'Depende de documentos', 'Em análise complementar', 'Inviável'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViability(v)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    viability === v ? 'bg-teal-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Decisão de Encaminhamento</label>
            <div className="flex flex-wrap gap-2">
              {['Prosseguir para contratação', 'Manter em avaliação', 'Nova consulta', 'Encerrar'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDecision(d)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    decision === d ? 'bg-teal-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          <FileClock className="w-3.5 h-3.5" /> Rascunho salvo há 5 seg
        </span>
        <Button className="bg-teal-800 hover:bg-teal-900 text-white rounded-full px-8 h-11 text-xs font-bold gap-2 shadow-sm">
          <Check className="w-4 h-4" /> Finalizar consulta
        </Button>
      </div>

      {/* MODAIS */}
      <AddFactDialog
        isOpen={isFactModalOpen}
        onClose={() => setIsFactModalOpen(false)}
        onAdd={handleAddFact}
      />

      <SelectFormDialog
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSelect={(form) => {
          setSelectedFormName(form.title)
          setLegalArea(form.area)
          setLegalTheme(form.theme)
        }}
      />
    </div>
  )
}