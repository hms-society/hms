import { useState } from 'react'
import {
  FileText,
  FileImage,
  Search,
  Check,
  CheckCircle2,
  X,
  User,
  AlertCircle,
} from 'lucide-react'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Textarea } from '@/ui/shadcn/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'

interface BatchFile {
  name: string
  size: string
  type: 'pdf' | 'image'
}

interface OrphanBatch {
  id: string
  batchId: string
  channel: 'WhatsApp' | 'E-mail'
  sender: string
  dateTime: string
  filesCount: number
  status: 'pending' | 'linked' | 'rejected'
  files?: BatchFile[]
  linkedPersonName?: string
  rejectionReason?: string
}

interface MockPerson {
  id: string
  name: string
  cpf: string
  status: 'Intake Ativo' | 'Sem Intake'
}

const MOCK_PEOPLE: MockPerson[] = [
  {
    id: 'p1',
    name: 'Mariana Costa Silva',
    cpf: '***.***.456-78',
    status: 'Intake Ativo',
  },
  {
    id: 'p2',
    name: 'Carlos Eduardo Oliveira',
    cpf: '***.***.123-99',
    status: 'Sem Intake',
  },
  {
    id: 'p3',
    name: 'Fernanda Lima Rocha',
    cpf: '***.***.789-10',
    status: 'Intake Ativo',
  },
  {
    id: 'p4',
    name: 'Vinicius Lopes',
    cpf: '***.***.555-22',
    status: 'Sem Intake',
  },
]

const INITIAL_BATCHES: OrphanBatch[] = [
  {
    id: '1',
    batchId: 'LOT-20260704-0041',
    channel: 'WhatsApp',
    sender: '+55 11 98765-4321',
    dateTime: '04/07 14:32',
    filesCount: 4,
    status: 'pending',
    files: [
      { name: 'procuracao_assinada.pdf', size: '420 KB', type: 'pdf' },
      { name: 'documento_rg_frente.jpg', size: '1.2 MB', type: 'image' },
      { name: 'comprovante_residencia.pdf', size: '380 KB', type: 'pdf' },
      { name: 'laudo_medico.pdf', size: '890 KB', type: 'pdf' },
    ],
  },
  {
    id: '2',
    batchId: 'LOT-20260704-0038',
    channel: 'WhatsApp',
    sender: '+55 21 99876-5432',
    dateTime: '04/07 11:20',
    filesCount: 1,
    status: 'pending',
    files: [{ name: 'contrato.pdf', size: '512 KB', type: 'pdf' }],
  },
  {
    id: '3',
    batchId: 'LOT-20260704-0035',
    channel: 'E-mail',
    sender: 'maria.silva@email.com',
    dateTime: '03/07 17:45',
    filesCount: 5,
    status: 'pending',
    files: [{ name: 'documento.pdf', size: '1.1 MB', type: 'pdf' }],
  },
  {
    id: '4',
    batchId: 'LOT-20260704-0033',
    channel: 'E-mail',
    sender: 'vinicius.lopes@email.com',
    dateTime: '03/07 15:10',
    filesCount: 2,
    status: 'pending',
    files: [{ name: 'rg.jpg', size: '2.3 MB', type: 'image' }],
  },
  {
    id: '5',
    batchId: 'LOT-20260704-0029',
    channel: 'WhatsApp',
    sender: '+55 85 90808-7777',
    dateTime: '03/07 09:28',
    filesCount: 4,
    status: 'pending',
    files: [{ name: 'comprovante.pdf', size: '300 KB', type: 'pdf' }],
  },
]

type FilterTab = 'all' | 'pending' | 'linked' | 'rejected'

export function Triagem() {
  const [batches, setBatches] = useState<OrphanBatch[]>(INITIAL_BATCHES)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedBatch, setSelectedBatch] = useState<OrphanBatch | null>(null)
  const [rejectingBatch, setRejectingBatch] = useState<OrphanBatch | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<MockPerson | null>(null)

  const filteredBatches = batches.filter((batch) => {
    if (activeTab === 'all') return true
    return batch.status === activeTab
  })

  const filteredPeople = MOCK_PEOPLE.filter(
    (person) =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.cpf.includes(searchQuery)
  )

  const getChannelBadge = (channel: OrphanBatch['channel']) => {
    switch (channel) {
      case 'WhatsApp':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-sans font-medium gap-1.5 py-0.5 px-2.5 rounded-full text-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            WhatsApp
          </Badge>
        )
      case 'E-mail':
        return (
          <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none font-sans font-medium gap-1.5 py-0.5 px-2.5 rounded-full text-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            E-mail
          </Badge>
        )
    }
  }

  const getEmptyStateMessage = () => {
    if (activeTab === 'linked') return 'Não há lotes vinculados ainda.'
    if (activeTab === 'rejected') return 'Não há lotes rejeitados ainda.'
    return 'Não há lotes para exibir ainda.'
  }

  const handleCloseModal = () => {
    setSelectedBatch(null)
    setSearchQuery('')
    setSelectedPerson(null)
  }

  const handleCloseRejectModal = () => {
    setRejectingBatch(null)
    setRejectionReason('')
  }

  const handleConfirmLink = () => {
    if (!selectedBatch || !selectedPerson) return

    setBatches((prev) =>
      prev.map((b) =>
        b.id === selectedBatch.id
          ? { ...b, status: 'linked', linkedPersonName: selectedPerson.name }
          : b
      )
    )
    handleCloseModal()
  }

  const handleConfirmRejection = () => {
    if (!rejectingBatch) return

    setBatches((prev) =>
      prev.map((b) =>
        b.id === rejectingBatch.id
          ? { ...b, status: 'rejected', rejectionReason }
          : b
      )
    )
    handleCloseRejectModal()
  }

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6 max-w-7xl font-sans mx-auto">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-serif">
          Caixa de Triagem de Lotes Órfãos
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
          Lotes documentais recebidos sem associação identificada - vincule cada lote a uma Pessoa ou Intake para prosseguir com a classificação.
        </p>
      </div>
      <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 pt-1 sm:pt-2">
        {(
          [
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: 'Pendentes' },
            { id: 'linked', label: 'Vinculados' },
            { id: 'rejected', label: 'Rejeitados' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-sans font-medium rounded-full transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-700 text-white'
                : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
          <p className="text-slate-500 text-xs sm:text-sm font-sans">
            {getEmptyStateMessage()}
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          <div className="hidden lg:grid grid-cols-12 px-6 py-2 text-xs font-sans font-semibold text-slate-400 uppercase tracking-wider items-center">
            <div className="col-span-2">ID do Lote</div>
            <div className="col-span-2">Canal</div>
            <div className="col-span-3">Remetente</div>
            <div className="col-span-2">Data e Hora</div>
            <div className="col-span-1">Arquivos</div>
            <div className="col-span-2 text-center">Ações</div>
          </div>
          {filteredBatches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all p-4 lg:px-6 lg:py-3.5">
              <div className="hidden lg:grid grid-cols-12 items-center">
                <div className="col-span-2">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-mono font-medium whitespace-nowrap">
                    {batch.batchId}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  {getChannelBadge(batch.channel)}
                </div>
                <div className="col-span-3 text-sm font-sans text-slate-800 truncate pr-2">
                  {batch.sender === 'Sem identificação' ? (
                    <span className="text-red-700 font-sans font-medium">{batch.sender}</span>
                  ) : (
                    batch.sender
                  )}
                </div>
                <div className="col-span-2 text-sm text-slate-500 font-sans font-medium whitespace-nowrap">
                  {batch.dateTime}
                </div>
                <div className="col-span-1 text-sm text-slate-500 font-sans font-medium whitespace-nowrap">
                  {batch.filesCount} {batch.filesCount === 1 ? 'arquivo' : 'arquivos'}
                </div>
                <div className="col-span-2 flex items-center justify-center gap-2">
                  {batch.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setSelectedBatch(batch)}
                        className="bg-teal-700 hover:bg-teal-800 text-white text-xs px-3.5 h-8 rounded-full font-sans font-medium shrink-0"
                      >
                        Vincular
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRejectingBatch(batch)}
                        className="border-red-600 text-red-700 hover:bg-red-50 hover:text-red-700 text-xs px-3.5 h-8 rounded-full font-sans font-medium shrink-0 transition-colors"
                      >
                        Rejeitar
                      </Button>
                    </>
                  )}

                  {batch.status === 'linked' && (
                    <Badge className="bg-teal-100 text-teal-800 border-none font-sans font-medium px-3 py-1 rounded-full text-xs whitespace-nowrap">
                      Vinculado a {batch.linkedPersonName?.split(' ')[0]}
                    </Badge>
                  )}

                  {batch.status === 'rejected' && (
                    <Badge className="bg-red-100 text-red-800 border-none font-sans font-medium px-3 py-1 rounded-full text-xs">
                      Rejeitado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex lg:hidden flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-mono font-medium">
                    {batch.batchId}
                  </span>
                  {getChannelBadge(batch.channel)}
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-800 truncate pr-2">
                    {batch.sender}
                  </span>
                  <span className="text-slate-500 shrink-0 font-medium">{batch.dateTime}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {batch.filesCount} {batch.filesCount === 1 ? 'arquivo' : 'arquivos'}
                  </span>

                  <div className="flex items-center gap-2">
                    {batch.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setSelectedBatch(batch)}
                          className="bg-teal-700 hover:bg-teal-800 text-white text-xs px-4 h-8 rounded-full font-sans font-medium"
                        >
                          Vincular
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectingBatch(batch)}
                          className="border-red-600 text-red-700 hover:bg-red-50 text-xs px-4 h-8 rounded-full font-sans font-medium"
                        >
                          Rejeitar
                        </Button>
                      </>
                    )}

                    {batch.status === 'linked' && (
                      <Badge className="bg-teal-100 text-teal-800 border-none font-sans font-medium px-3 py-1 rounded-full text-xs">
                        Vinculado a {batch.linkedPersonName?.split(' ')[0]}
                      </Badge>
                    )}

                    {batch.status === 'rejected' && (
                      <Badge className="bg-red-100 text-red-800 border-none font-sans font-medium px-3 py-1 rounded-full text-xs">
                        Rejeitado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={!!selectedBatch}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="w-[92vw] sm:max-w-md max-h-[90vh] p-4 sm:p-6 rounded-3xl bg-white border-none shadow-xl flex flex-col gap-0 [&>button]:hidden font-sans">
          <DialogHeader className="p-0 space-y-0 hidden">
            <DialogTitle className="font-serif">Confirmar Vínculo</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-800">
                Lote {selectedBatch?.batchId}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 font-sans flex-wrap font-medium">
              {selectedBatch && getChannelBadge(selectedBatch.channel)}
              <span>•</span>
              <span>{selectedBatch?.dateTime}</span>
              <span>•</span>
              <span className="truncate max-w-[150px]">{selectedBatch?.sender}</span>
            </div>
          </div>

          <div className="overflow-y-auto space-y-4 py-2 pr-1 flex-1 font-sans">
            <hr className="border-slate-100" />
            <div className="space-y-3">
              <span className="text-xs font-bold font-sans uppercase tracking-wider text-slate-400">
                Arquivos do Lote
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedBatch?.files?.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100/80"
                  >
                    <div className="p-1.5 rounded-lg bg-red-50 shrink-0">
                      {file.type === 'image' ? (
                        <FileImage className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold font-sans text-slate-800 truncate">
                        {file.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-sans font-medium">
                        {file.size}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <hr className="border-slate-100" />
            <div className="space-y-3">
              <span className="text-xs font-bold font-sans uppercase tracking-wider text-slate-400">
                Associar Lote
              </span>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs sm:text-sm font-sans focus-visible:ring-teal-700"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 font-sans">
                {filteredPeople.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3 font-sans">
                    Nenhuma pessoa encontrada.
                  </p>
                ) : (
                  filteredPeople.map((person) => {
                    const isSelected = selectedPerson?.id === person.id
                    return (
                      <div
                        key={person.id}
                        onClick={() => setSelectedPerson(person)}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/30 ring-1 ring-teal-700'
                            : 'border-slate-200/80 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold font-sans text-slate-800 leading-tight truncate">
                              {person.name}
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 font-sans">
                              CPF: {person.cpf}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            className={`border-none font-sans font-medium px-2 py-0.5 rounded-full text-[10px] ${
                              person.status === 'Intake Ativo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {person.status}
                          </Badge>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-teal-700 text-white'
                                : 'border border-slate-300'
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 fill-teal-700 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-auto border-t border-slate-100 shrink-0">
            <Button
              disabled={!selectedPerson}
              className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-full h-11 text-xs sm:text-sm font-sans font-medium gap-2 shadow-sm"
              onClick={handleConfirmLink}
            >
              <Check className="w-4 h-4" />
              {selectedPerson
                ? `Confirmar Vínculo para ${selectedPerson.name.split(' ')[0]}`
                : 'Selecione uma pessoa para vincular'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!rejectingBatch}
        onOpenChange={(open) => !open && handleCloseRejectModal()}
      >
        <DialogContent className="w-[92vw] sm:max-w-md p-4 sm:p-6 rounded-3xl bg-white border-none shadow-xl flex flex-col items-center text-center gap-4 sm:gap-5 [&>button]:hidden font-sans">
          <DialogHeader className="p-0 space-y-0 hidden">
            <DialogTitle className="font-serif">Rejeitar Lote</DialogTitle>
          </DialogHeader>

          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100/80 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-800">
              Deseja rejeitar este lote?
            </h3>
            <p className="text-xs text-slate-500 font-sans leading-relaxed px-1 sm:px-2">
              Ao rejeitar, os arquivos do lote{' '}
              <span className="font-semibold text-slate-700 font-sans">
                {rejectingBatch?.batchId}
              </span>{' '}
              serão arquivados e o remetente não será notificado. Esta ação pode ser revertida pelo administrador.
            </p>
          </div>

          <div className="w-full space-y-1.5 text-left">
            <label className="text-xs font-bold font-sans text-slate-700">
              Motivo da Rejeição <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Descreva o motivo da rejeição..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[90px] rounded-2xl bg-white border border-slate-300 text-xs sm:text-sm font-sans focus-visible:ring-1 focus-visible:border-red-600 resize-none p-3.5 shadow-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full pt-1 font-sans">
            <Button
              variant="outline"
              onClick={handleCloseRejectModal}
              className="w-full border-red-600/80 text-red-700 hover:bg-red-50 hover:text-red-700 rounded-full h-10 sm:h-11 text-xs sm:text-sm font-sans font-medium"
            >
              Cancelar
            </Button>
            <Button
              disabled={!rejectionReason.trim()}
              onClick={handleConfirmRejection}
              className="w-full bg-red-800 hover:bg-red-900 disabled:opacity-50 text-white rounded-full h-10 sm:h-11 text-xs sm:text-sm font-sans font-medium shadow-sm"
            >
              Confirmar Rejeição
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}