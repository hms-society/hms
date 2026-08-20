import React, { useState } from 'react';
import {
  Users,
  Send,
  ScrollText,
  Eye,
  Check,
  Clock,
  RefreshCw,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { useIntakeFormalizationQuery } from './use-intake-formalization-query';

type SignatureChannel = 'whatsapp' | 'email';

interface SignatoryStatus {
  id: string;
  name: string;
  taxId: string;
  channel: SignatureChannel;
  isSigned: boolean;
  statusText: string;
}

interface DocumentItem {
  id: string;
  name: string;
  signatories: SignatoryStatus[];
  viewSignedUrl?: string;
}

interface CollaboratorItem {
  id: string;
  name: string;
  role: string;
}
const MOCK_DATA = {
  collaborators: [
    { id: 'col-1', name: 'Hudson M. Silva', role: 'Advogado responsável' },
    { id: 'col-2', name: 'Ana Epaminondas', role: 'Advogada colaboradora' },
  ] as CollaboratorItem[],
  dispatch: {
    sentAt: '03/07/2026 às 14:22',
    signatoriesCount: '3 pessoas',
  },
  lastUpdatedText: 'Última atualização há 2 minutos.',
  documents: [
    {
      id: 'doc-1',
      name: 'Contrato de Honorários Advocatícios',
      viewSignedUrl: '#',
      signatories: [
        {
          id: 'sig-1',
          name: 'Maria Aparecida Silva',
          taxId: '123.***.***-00',
          channel: 'whatsapp',
          isSigned: true,
          statusText: 'assinado às 14:31',
        },
        {
          id: 'sig-2',
          name: 'Ana Epaminondas',
          taxId: '987.***.***-10',
          channel: 'email',
          isSigned: true,
          statusText: 'assinado às 14:32',
        },
      ],
    },
    {
      id: 'doc-2',
      name: 'Procuração Ad Judicia',
      viewSignedUrl: '#',
      signatories: [
        {
          id: 'sig-3',
          name: 'Maria Aparecida Silva',
          taxId: '123.***.***-00',
          channel: 'whatsapp',
          isSigned: true,
          statusText: 'assinado às 14:33',
        },
      ],
    },
    {
      id: 'doc-3',
      name: 'Termo de Ciência e Consentimento LGPD',
      signatories: [
        {
          id: 'sig-4',
          name: 'Maria Aparecida Silva',
          taxId: '123.***.***-00',
          channel: 'whatsapp',
          isSigned: false,
          statusText: 'último envio há 3 dias',
        },
      ],
    },
    {
      id: 'doc-4',
      name: 'Contrato de Prestação de Serviços',
      signatories: [
        {
          id: 'sig-5',
          name: 'Maria Aparecida Silva',
          taxId: '123.***.***-00',
          channel: 'whatsapp',
          isSigned: true,
          statusText: 'assinado em 04/07 às 10:18',
        },
        {
          id: 'sig-6',
          name: 'João Carlos Pereira',
          taxId: '456.***.***-22',
          channel: 'email',
          isSigned: false,
          statusText: 'último envio há 3 dias',
        },
      ],
    },
  ] as DocumentItem[],
};

const CHANNEL_ICON: Record<SignatureChannel, React.ElementType> = {
  whatsapp: MessageCircle,
  email: Mail,
};

const CHANNEL_LABEL: Record<SignatureChannel, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
};

const formatIntakeCode = (intake: { sequenceNumber: number; createdAt: Date }) => {
  const date = new Date(intake.createdAt);
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const sequencePart = String(intake.sequenceNumber).padStart(3, '0');

  return `INT-${datePart}-${sequencePart}`;
};

const formatConsultationCode = (consultation: { createdAt: Date | string }) => {
  const date = new Date(consultation.createdAt);
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');

  return `CON-${datePart}`;
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

interface SignatureTrackingPageProps {
  intakeId: string;
  consultationId?: string;
}

export const SignatureTrackingPage: React.FC<SignatureTrackingPageProps> = ({
  intakeId,
  consultationId,
}) => {
  const { data, isLoading, isError } = useIntakeFormalizationQuery(intakeId, consultationId);
  const [documents] = useState<DocumentItem[]>(MOCK_DATA.documents);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const allSignatories = documents.flatMap((doc) => doc.signatories);
  const totalSignatures = allSignatories.length;
  const signedCount = allSignatories.filter((s) => s.isSigned).length;
  const percentage =
    totalSignatures > 0 ? Math.round((signedCount / totalSignatures) * 100) : 0;

  const handleResend = (signatoryId: string) => {
    setResendingId(signatoryId);
    setTimeout(() => {
      setResendingId(null);
    }, 1000);
  };

  if (isLoading) {
    return <div className="p-4 sm:p-8 text-sm text-slate-500">Carregando...</div>;
  }

  if (isError || !data) {
    return (
      <div className="p-4 sm:p-8 text-sm text-red-600">
        Não foi possível carregar os dados do cliente.
      </div>
    );
  }

  const { client, intake, consultation } = data;

  const clientName = client.type === 'natural' ? client.name : client.legalName;
  const clientTaxId = client.taxId.value;
  const clientTaxIdLabel = client.type === 'natural' ? 'CPF' : 'CNPJ';

  return (
    <div className="w-full max-w-[1040px] mx-auto p-4 sm:p-6 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
        <span className="text-slate-500">
          Referente a:
          <strong className="text-slate-900 font-serif text-base sm:text-lg ml-1">
            {clientName}
          </strong>
        </span>
        <span className="text-slate-400">#{formatIntakeCode(intake)}</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100 mt-1 sm:mt-0">
          <Send className="w-3 h-3 rotate-45" /> Enviado — aguardando assinaturas
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Users className="w-3.5 h-3.5 text-slate-600" />
          <span>Cliente e colaboradores</span>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg p-3">
          <div className="w-9 h-9 rounded-full bg-[#184e46] text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {initials(clientName)}
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-800">{clientName}</p>
            <p className="text-slate-400">
              Cliente · {clientTaxIdLabel} {clientTaxId}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-400 tracking-wide mb-2">
            COLABORADORES RESPONSÁVEIS
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MOCK_DATA.collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center gap-3 border border-slate-200 rounded-lg p-3"
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0">
                  {initials(collaborator.name)}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800">{collaborator.name}</p>
                  <p className="text-slate-400">{collaborator.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {consultation && (
          <div className="pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-400 block mb-0.5">Consulta</span>
            <span className="text-slate-800 font-medium">
              {formatConsultationCode(consultation)} ({consultation.viability ?? '—'})
            </span>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3">
          <Send className="w-3.5 h-3.5 text-slate-600 rotate-45" />
          <span>Envio realizado</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Enviado em</span>
            <span className="text-slate-800 font-medium">{MOCK_DATA.dispatch.sentAt}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Signatários</span>
            <span className="text-slate-800 font-medium">
              {MOCK_DATA.dispatch.signatoriesCount}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-slate-700 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">
              Acompanhamento das assinaturas
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{MOCK_DATA.lastUpdatedText}</p>
        </div>

        <div className="space-y-5">
          {documents.map((doc) => {
            const docSignedCount = doc.signatories.filter((s) => s.isSigned).length;
            const docTotal = doc.signatories.length;
            const isDocComplete = docSignedCount === docTotal;

            return (
              <div key={doc.id} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        isDocComplete ? 'bg-teal-600' : 'bg-slate-400'
                      }`}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {docSignedCount} de {docTotal} assinaturas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto pl-5 sm:pl-0">
                    {isDocComplete && doc.viewSignedUrl && (
                      <a
                        href={doc.viewSignedUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Ver assinado</span>
                      </a>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                        isDocComplete
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isDocComplete ? (
                        <>
                          <Check className="w-3 h-3 shrink-0" /> Assinado
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 shrink-0" /> Aguardando assinaturas
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="pl-5 space-y-2">
                  {doc.signatories.map((signatory) => {
                    const ChannelIcon = CHANNEL_ICON[signatory.channel];

                    return (
                      <div
                        key={signatory.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
                            {initials(signatory.name)}
                          </div>
                          <div className="text-xs">
                            <p className="font-medium text-slate-800">{signatory.name}</p>
                            <p className="text-slate-400 flex items-center gap-1">
                              <span>{signatory.taxId}</span>
                              <span className="inline-flex items-center gap-1">
                                <ChannelIcon className="w-3 h-3" />
                                {CHANNEL_LABEL[signatory.channel]}
                              </span>
                              <span>· {signatory.statusText}</span>
                            </p>
                          </div>
                        </div>

                        <div className="self-end sm:self-auto">
                          {signatory.isSigned ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <Check className="w-3 h-3 shrink-0" /> Assinado
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <Clock className="w-3 h-3 shrink-0" /> Aguardando
                              </span>
                              <button
                                type="button"
                                onClick={() => handleResend(signatory.id)}
                                disabled={resendingId === signatory.id}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#184e46] text-[#184e46] hover:bg-[#184e46]/5 text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                <RefreshCw
                                  className={`w-3 h-3 shrink-0 ${
                                    resendingId === signatory.id ? 'animate-spin' : ''
                                  }`}
                                />
                                Reenviar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>
              {signedCount} de {totalSignatures} documentos assinados
            </span>
            <span className="font-semibold text-teal-800">{percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#184e46] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
