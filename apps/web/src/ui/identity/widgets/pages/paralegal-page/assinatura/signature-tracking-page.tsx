import React, { useState } from 'react';
import {
  User,
  Send,
  Hourglass,
  Eye,
  Check,
  Circle,
  PenTool,
} from 'lucide-react';
import { useIntakeFormalizationQuery } from './use-intake-formalization-query';

interface DocumentItem {
  id: string;
  name: string;
  isSigned: boolean;
  statusText: string;
  signatory: string;
  viewSignedUrl?: string;
}

const MOCK_DATA = {
  dispatch: {
    sentAt: '03/07/2026 às 14:22',
    sentBy: 'Dr. Hudson M. Silva',
    channel: 'WhatsApp',
    signatoriesCount: '2 pessoas',
    deadline: '15 dias (expira 18/07)',
  },
  context: {
    pendingCount: 2,
    daysSinceSent: 3,
    expiresInDays: 12,
  },
  documents: [
    {
      id: 'doc-1',
      name: 'Contrato de Honorários Advocatícios',
      isSigned: true,
      statusText: '03/07/2026 às 14:32',
      signatory: 'Maria Aparecida Silva',
      viewSignedUrl: '#',
    },
    {
      id: 'doc-2',
      name: 'Procuração Ad Judicia',
      isSigned: true,
      statusText: '03/07/2026 às 14:33',
      signatory: 'Maria Aparecida Silva',
      viewSignedUrl: '#',
    },
    {
      id: 'doc-3',
      name: 'Termo de Ciência e Consentimento LGPD',
      isSigned: false,
      statusText: 'Enviado em 03/07/2026 às 14:22',
      signatory: 'Maria Aparecida Silva',
    },
    {
      id: 'doc-4',
      name: 'Contrato de Prestação de Serviços',
      isSigned: false,
      statusText: 'Enviado em 03/07/2026 às 14:22',
      signatory: 'João Carlos Pereira',
    },
  ] as DocumentItem[],
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
  const [isResending, setIsResending] = useState(false);

  const totalDocuments = documents.length;
  const signedCount = documents.filter((doc) => doc.isSigned).length;
  const percentage = Math.round((signedCount / totalDocuments) * 100);

  const handleResend = () => {
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
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

      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3">
          <User className="w-3.5 h-3.5 text-slate-600" />
          <span>Cliente</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs">
          <div className="break-words">
            <span className="text-slate-400 block mb-0.5">{clientTaxIdLabel}</span>
            <span className="text-slate-800 font-medium">{clientTaxId}</span>
          </div>
          <div className="break-words">
            <span className="text-slate-400 block mb-0.5">Telefone</span>
            <span className="text-slate-800 font-medium">{client.phone ?? '—'}</span>
          </div>
          <div className="break-words">
            <span className="text-slate-400 block mb-0.5">E-mail</span>
            <span className="text-slate-800 font-medium">{client.email ?? '—'}</span>
          </div>
          <div className="break-words">
            <span className="text-slate-400 block mb-0.5">Consulta</span>
            <span className="text-slate-800 font-medium">
              {consultation
                ? `${formatConsultationCode(consultation)} (${consultation.viability ?? '—'})`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3">
          <Send className="w-3.5 h-3.5 text-slate-600 rotate-45" />
          <span>Envio realizado</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Enviado em</span>
            <span className="text-slate-800 font-medium">{MOCK_DATA.dispatch.sentAt}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Enviado por</span>
            <span className="text-slate-800 font-medium">{MOCK_DATA.dispatch.sentBy}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Canal</span>
            <span className="text-slate-800 font-medium">{MOCK_DATA.dispatch.channel}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Signatários</span>
            <span className="text-slate-800 font-medium">{MOCK_DATA.dispatch.signatoriesCount}</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-400 block mb-0.5">Prazo</span>
            <span className="text-slate-800 font-medium">{MOCK_DATA.dispatch.deadline}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Hourglass className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="leading-relaxed">
            Aguardando {MOCK_DATA.context.pendingCount} assinaturas · {MOCK_DATA.context.daysSinceSent} dias desde o envio · expira em {MOCK_DATA.context.expiresInDays} dias
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
            type="button"
            className="flex-1 sm:flex-none justify-center px-4 py-1.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="flex-1 sm:flex-none justify-center px-4 py-1.5 rounded-full border border-[#184e46] text-[#184e46] hover:bg-[#184e46]/5 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Send className="w-3 h-3 rotate-45 shrink-0" />
            <span>Reenviar link</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-slate-700 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">
              Status das Assinaturas Eletrônicas
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Atualizado automaticamente via integração com API.
          </p>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b sm:border-b-0 border-slate-100 last:border-0"
            >
              <div className="flex items-start sm:items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-1 sm:mt-0 shrink-0 ${
                    doc.isSigned ? 'bg-teal-600' : 'bg-slate-400'
                  }`}
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-snug">{doc.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    {doc.statusText} · Signatário: {doc.signatory}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto pl-5 sm:pl-0">
                {doc.isSigned ? (
                  <>
                    {doc.viewSignedUrl && (
                      <a
                        href={doc.viewSignedUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Ver assinado</span>
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Check className="w-3 h-3 shrink-0" /> Assinado
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <Circle className="w-3 h-3 text-slate-400 shrink-0" /> Não assinado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>{signedCount} de {totalDocuments} documentos assinados</span>
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