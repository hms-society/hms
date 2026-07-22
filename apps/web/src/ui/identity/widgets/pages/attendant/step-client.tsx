import { Button } from '#/ui/shadcn/button'
import { Badge } from '#/ui/shadcn/badge'
import { Avatar, AvatarFallback } from '#/ui/shadcn/avatar'
import { Label } from '#/ui/shadcn/label'
import { Input } from '#/ui/shadcn/input'
import { Separator } from '#/ui/shadcn/separator'
import { Search, UserRound, ExternalLink, X, UserPlus, FileText, Phone, Mail, Clock, Check } from 'lucide-react'
import { useState } from 'react'

export const StepClient = () => {
  const [vinculado, setVinculado] = useState(false)
  const [busca, setBusca] = useState('')
  const [mostrarResultado, setMostrarResultado] = useState(false)

  const handleBuscar = () => {
    if (busca.trim()) setMostrarResultado(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserRound className="w-4 h-4 text-primary" />
            <span className="text-[16px] font-serif text-foreground">
              Vincular pessoa ao intake
            </span>
          </div>
          {vinculado && (
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 rounded-pill">
              <Check className="w-3 h-3" />
              Vinculado
            </Badge>
          )}
        </div>
        <Separator />
        <div className="flex flex-col gap-1.5">
          <Label>Buscar por telefone ou nome:</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="(00) 00000-0000 ou nome"
                className="pl-8"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              />
            </div>
            <Button onClick={handleBuscar}>
              <Search />
              Buscar
            </Button>
          </div>
        </div>

        {mostrarResultado && (
          <div className="flex items-start justify-between bg-muted/40 border border-border rounded-xl p-4 gap-4">
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary/15 text-primary text-[13px] font-bold">
                  RA
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-foreground">Ricardo Alves</span>
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 rounded-pill text-[11px]">
                    Interessado
                  </Badge>
                </div>
                <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" /> 123.456.789-00
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" /> (12) 98765-4321
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" /> ricardo.alves@email.com
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> 1 intake anterior (encerrado)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button onClick={() => setVinculado(true)}>
                <ExternalLink />
                Ver cadastro
              </Button>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMostrarResultado(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <Button variant="brand" className="w-full rounded-pill py-3 h-auto">
        <UserPlus />
        Cadastrar nova pessoa
      </Button>
    </div>
  )
}