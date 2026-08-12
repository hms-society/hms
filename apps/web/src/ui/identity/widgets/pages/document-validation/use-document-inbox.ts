import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const MOCK_INBOX_DATA = [
  {
    id: "1",
    fileName: "comprovante-residencia.pdf",
    fileSize: "2.4 MB",
    receivedFromIcon: "circle-help",
    receivedFrom: "Mariana Costa Silva",
    contactInfo: "Portal do cliente · mariana.silva@email.com",
    caseId: "Caso 0089",
    caseDesc: "Comprovante de residência",
    receivedDate: "Hoje",
    receivedTime: "14:32",
    status: "Aguardando validação",
    badgeClasses: "bg-[#E1F5F6] text-[#0F5C61]",
    dotClasses: "bg-[#0FA0AA]",
  },
  {
    id: "2",
    fileName: "extrato-bancario.pdf",
    fileSize: "1.1 MB",
    receivedFromIcon: "message-circle",
    receivedFrom: "João Paulo Mendes",
    contactInfo: "WhatsApp · +55 21 99876-5432",
    caseId: "Caso 0091",
    caseDesc: "Extrato bancário",
    receivedDate: "Hoje",
    receivedTime: "13:08",
    status: "Validado",
    badgeClasses: "bg-[#E8F5E9] text-[#1B5E20]",
    dotClasses: "bg-[#2E7D32]",
  },
  {
    id: "3",
    fileName: "rg-frente-verso.jpg",
    fileSize: "3.8 MB",
    receivedFromIcon: "mail",
    receivedFrom: "Ana Beatriz Lima",
    contactInfo: "E-mail · ana.lima@email.com",
    caseId: "Sem vínculo seguro",
    caseDesc: "Escolha manual necessária",
    receivedDate: "Ontem",
    receivedTime: "17:45",
    status: "Ilegível",
    badgeClasses: "bg-[#FFEBEE] text-[#7B1515]",
    dotClasses: "bg-[#A02822]",
  },
  {
    id: "4",
    fileName: "contrato-social.pdf",
    fileSize: "890 KB",
    receivedFromIcon: "circle-help",
    receivedFrom: "Alvorada Serviços Ltda.",
    contactInfo: "Portal do cliente · documentos@alvorada.com.br",
    caseId: "Caso 0094",
    caseDesc: "Contrato social",
    receivedDate: "Ontem",
    receivedTime: "16:20",
    status: "Incompleto",
    badgeClasses: "bg-[#FFF3E0] text-[#7C4700]",
    dotClasses: "bg-[#B36D32]",
  },
  {
    id: "5",
    fileName: "declaracao-hipossuficiencia.pdf",
    fileSize: "620 KB",
    receivedFromIcon: "circle-help",
    receivedFrom: "Rafael Nunes",
    contactInfo: "Portal do cliente · rafael.nunes@email.com",
    caseId: "Caso 0087",
    caseDesc: "Declaração de hipossuficiência",
    receivedDate: "Ontem",
    receivedTime: "15:02",
    status: "Duplicado",
    badgeClasses: "bg-muted text-muted-foreground",
    dotClasses: "bg-muted-foreground",
  },
  {
    id: "6",
    fileName: "procuracao-assinada.pdf",
    fileSize: "740 KB",
    receivedFromIcon: "message-circle",
    receivedFrom: "Cláudia Ferreira",
    contactInfo: "WhatsApp · +55 11 98765-1098",
    caseId: "Caso não identificado",
    caseDesc: "Análise interrompida",
    receivedDate: "05/08/2026",
    receivedTime: "11:26",
    status: "Falha no processamento",
    badgeClasses: "bg-destructive text-white",
    dotClasses: "bg-white",
  },
  {
    id: "7",
    fileName: "cnh-motorista.pdf",
    fileSize: "1.2 MB",
    receivedFromIcon: "mail",
    receivedFrom: "Carlos Almeida",
    contactInfo: "E-mail · carlos.almeida@email.com",
    caseId: "Caso 0102",
    caseDesc: "CNH",
    receivedDate: "04/08/2026",
    receivedTime: "09:15",
    status: "Aguardando validação",
    badgeClasses: "bg-[#E1F5F6] text-[#0F5C61]",
    dotClasses: "bg-[#0FA0AA]",
  },
  {
    id: "8",
    fileName: "holerite-mes-anterior.pdf",
    fileSize: "450 KB",
    receivedFromIcon: "circle-help",
    receivedFrom: "Fernanda Lima",
    contactInfo: "Portal do cliente · fernanda.lima@email.com",
    caseId: "Caso 0105",
    caseDesc: "Comprovante de renda",
    receivedDate: "04/08/2026",
    receivedTime: "14:20",
    status: "Aguardando validação",
    badgeClasses: "bg-[#E1F5F6] text-[#0F5C61]",
    dotClasses: "bg-[#0FA0AA]",
  },
  {
    id: "9",
    fileName: "certidao-nascimento.jpg",
    fileSize: "4.1 MB",
    receivedFromIcon: "message-circle",
    receivedFrom: "Roberto Gomes",
    contactInfo: "WhatsApp · +55 11 91234-5678",
    caseId: "Caso 0110",
    caseDesc: "Certidão de nascimento",
    receivedDate: "03/08/2026",
    receivedTime: "16:40",
    status: "Ilegível",
    badgeClasses: "bg-[#FFEBEE] text-[#7B1515]",
    dotClasses: "bg-[#A02822]",
  },
  {
    id: "10",
    fileName: "comprovante-pix.png",
    fileSize: "800 KB",
    receivedFromIcon: "message-circle",
    receivedFrom: "Juliana Souza",
    contactInfo: "WhatsApp · +55 21 98888-7777",
    caseId: "Caso 0112",
    caseDesc: "Comprovante de pagamento",
    receivedDate: "03/08/2026",
    receivedTime: "10:05",
    status: "Validado",
    badgeClasses: "bg-[#E8F5E9] text-[#1B5E20]",
    dotClasses: "bg-[#2E7D32]",
  },
  {
    id: "11",
    fileName: "carteira-trabalho.pdf",
    fileSize: "3.2 MB",
    receivedFromIcon: "circle-help",
    receivedFrom: "Marcos Silva",
    contactInfo: "Portal do cliente · marcos.silva@email.com",
    caseId: "Caso 0115",
    caseDesc: "CTPS",
    receivedDate: "02/08/2026",
    receivedTime: "11:30",
    status: "Incompleto",
    badgeClasses: "bg-[#FFF3E0] text-[#7C4700]",
    dotClasses: "bg-[#B36D32]",
  },
  {
    id: "12",
    fileName: "laudo-medico.pdf",
    fileSize: "5.5 MB",
    receivedFromIcon: "mail",
    receivedFrom: "Patrícia Ribeiro",
    contactInfo: "E-mail · patricia.ribeiro@email.com",
    caseId: "Sem vínculo seguro",
    caseDesc: "Escolha manual necessária",
    receivedDate: "02/08/2026",
    receivedTime: "15:50",
    status: "Aguardando validação",
    badgeClasses: "bg-[#E1F5F6] text-[#0F5C61]",
    dotClasses: "bg-[#0FA0AA]",
  },
] as const;

const ITEMS_PER_PAGE = 6;

function parseDocumentDate(receivedDate: string): Date {
  const today = new Date();

  if (receivedDate === "Hoje") {
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
  }

  if (receivedDate === "Ontem") {
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 1,
    );
  }

  const [day, month, year] = receivedDate.split("/").map(Number);

  return new Date(year, month - 1, day);
}

function normalizeDate(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

export function useDocumentInbox() {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const [appliedStatusFilter, setAppliedStatusFilter] = useState("");
  const [appliedClientFilter, setAppliedClientFilter] = useState("");
  const [appliedDateStart, setAppliedDateStart] = useState("");
  const [appliedDateEnd, setAppliedDateEnd] = useState("");

  const filteredData = MOCK_INBOX_DATA.filter((doc) => {
    if (
      appliedStatusFilter &&
      doc.status !== appliedStatusFilter
    ) {
      return false;
    }

    if (
      appliedClientFilter &&
      doc.receivedFrom !== appliedClientFilter
    ) {
      return false;
    }

    if (appliedDateStart) {
      const documentDate = normalizeDate(
        parseDocumentDate(doc.receivedDate),
      );

      const startDate = normalizeDate(
        new Date(`${appliedDateStart}T00:00:00`),
      );

      if (documentDate < startDate) {
        return false;
      }

      if (appliedDateEnd) {
        const endDate = normalizeDate(
          new Date(`${appliedDateEnd}T00:00:00`),
        );

        if (documentDate > endDate) {
          return false;
        }
      } else {
        if (documentDate.getTime() !== startDate.getTime()) {
          return false;
        }
      }
    }

    return true;
  });

  const totalItems = filteredData.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / ITEMS_PER_PAGE),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedData = filteredData.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE,
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApplyFilters = () => {
    setAppliedStatusFilter(statusFilter);
    setAppliedClientFilter(clientFilter);
    setAppliedDateStart(dateStart);
    setAppliedDateEnd(dateEnd);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setClientFilter("");
    setDateFilter("");
    setDateStart("");
    setDateEnd("");

    setAppliedStatusFilter("");
    setAppliedClientFilter("");
    setAppliedDateStart("");
    setAppliedDateEnd("");

    setCurrentPage(1);
  };

  const handleAnalyze = (fileId: string) => {
    navigate({
      to: "/caixa-de-documentos/$fileId",
      params: { fileId },
    });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return {
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    paginatedData,
    handlePageChange,
    handleAnalyze,
    handleRefresh,

    statusFilter,
    dateFilter,
    clientFilter,
    dateStart,
    dateEnd,

    setStatusFilter,
    setDateFilter,
    setClientFilter,
    setDateStart,
    setDateEnd,

    handleApplyFilters,
    handleClearFilters,
  };
}