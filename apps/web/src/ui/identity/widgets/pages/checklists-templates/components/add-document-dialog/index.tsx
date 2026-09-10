import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/shadcn/dialog";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { Button } from "@/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/shadcn/select";
import type { DocumentFileType } from "../../types";

type AddDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, type: DocumentFileType, required: boolean) => void;
};

export function AddDocumentDialog({
  open,
  onOpenChange,
  onAdd,
}: AddDocumentDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentFileType | undefined>();
  const [required, setRequired] = useState(true);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setName("");
      setType(undefined);
      setRequired(true);
    }

    onOpenChange(value);
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();

    if (!trimmedName || !type) return;

    onAdd(trimmedName, type, required);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          w-[calc(100%-32px)]
          max-w-[420px]
          h-[478px]
          gap-0
          overflow-hidden
          rounded-[16px]
          border-0
          bg-white
          p-0
          shadow-[0_12px_35px_rgba(0,0,0,0.18)]
        "
      >
        <DialogHeader
          className="
            flex
            h-[72px]
            shrink-0
            flex-row
            items-center
            border-b
            border-[#E5E9ED]
            px-5
          "
        >
          <DialogTitle
            className="
              font-serif
              text-[20px]
              font-semibold
              leading-[26px]
              tracking-[-0.2px]
              text-[#164F55]
            "
          >
            Adicionar Documento ao Checklist
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 px-5 pt-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="document-name"
                className="
                  text-[14px]
                  font-semibold
                  leading-[18px]
                  text-[#171B2A]
                "
              >
                Nome do Documento <span className="text-[#B42318]">*</span>
              </Label>

              <Input
                id="document-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Procuração Assinada"
                autoFocus
                className="
                  h-[44px]
                  rounded-[9px]
                  border-[#D8E0E6]
                  px-[14px]
                  text-[14px]
                  text-[#252B35]
                  shadow-none
                  placeholder:text-[#6B7078]
                  focus-visible:border-[#377F85]
                  focus-visible:ring-1
                  focus-visible:ring-[#377F85]
                "
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="document-type"
                className="
                  text-[14px]
                  font-semibold
                  leading-[18px]
                  text-[#171B2A]
                "
              >
                Tipo de Arquivo Aceito <span className="text-[#B42318]">*</span>
              </Label>

              <Select
                value={type}
                onValueChange={(value) => setType(value as DocumentFileType)}
              >
                <SelectTrigger
                  id="document-type"
                  className="
                    h-[44px]
                    rounded-[9px]
                    border-[#D8E0E6]
                    px-[14px]
                    text-[14px]
                    text-[#252B35]
                    shadow-none
                    focus:ring-1
                    focus:ring-[#377F85]
                  "
                >
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DOCX">DOCX</SelectItem>
                  <SelectItem value="Imagem">Imagem</SelectItem>
                  <SelectItem value="Qualquer">Qualquer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-between">
              <div className="pr-4">
                <p
                  className="
                    text-[14px]
                    font-semibold
                    leading-[18px]
                    text-[#171B2A]
                  "
                >
                  Obrigatório de Mérito
                </p>

                <p
                  className="
                    mt-1
                    max-w-[300px]
                    text-[12px]
                    leading-[17px]
                    text-[#5F6368]
                  "
                >
                  Quando ativo, este documento bloqueia o avanço do checklist se
                  não for recebido.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={required}
                aria-label="Obrigatório de Mérito"
                onClick={() => setRequired((value) => !value)}
                className={`
    relative
    mt-[1px]
    inline-flex
    h-[22px]
    w-[40px]
    shrink-0
    cursor-pointer
    appearance-none
    items-center
    rounded-full
    border-0
    p-0
    outline-none
    transition-colors
    duration-200
    focus-visible:ring-2
    focus-visible:ring-[#377F85]
    focus-visible:ring-offset-2
    ${required ? "bg-[#175A60]" : "bg-[#CBD2D7]"}
  `}
              >
                <span
                  className={`
      pointer-events-none
      absolute
      left-[3px]
      top-[3px]
      h-[16px]
      w-[16px]
      rounded-full
      bg-white
      shadow-[0_1px_3px_rgba(0,0,0,0.2)]
      transition-transform
      duration-200
      ${required ? "translate-x-[18px]" : "translate-x-0"}
    `}
                />
              </button>
            </div>
          </div>
        </div>

        <DialogFooter
          className="
    flex
    h-[72px]
    shrink-0
    flex-row
    items-end
    justify-end
    gap-[10px]
    border-0
    bg-white
    px-5
    pb-5
    pt-0
  "
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="
      h-[40px]
      rounded-full
      border-[#367F85]
      bg-white
      px-[18px]
      text-[14px]
      font-medium
      text-[#367F85]
      shadow-none
      hover:bg-[#F3F8F8]
      hover:text-[#367F85]
      focus:bg-white
      focus:text-[#367F85]
      active:bg-white
    "
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="brand"
            disabled={!name.trim() || !type}
            onClick={handleSubmit}
            className="
      h-[40px]
      rounded-full
      border-0
      bg-[#43848A]
      px-[20px]
      text-[14px]
      font-medium
      text-white
      shadow-none
      hover:bg-[#36757B]
      hover:text-white
      focus:bg-[#43848A]
      focus:text-white
      active:bg-[#43848A]
      disabled:bg-[#43848A]
      disabled:text-white
      disabled:opacity-50
    "
          >
            Adicionar ao Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
