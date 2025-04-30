import React, { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export const DOCUMENT_TYPES = [
  { value: "notice", label: "Aviso" },
  { value: "regulation", label: "Regulamento" },
  { value: "communication", label: "Comunicado" },
  { value: "document", label: "Documento" },
];

export const NOTIFICATION_TARGETS = [
  { value: "all", label: "Todos" },
  { value: "pml", label: "PML" },
  { value: "pol", label: "POL" },
];

export interface FormValues {
  title: string;
  description?: string;
  documentType: string;
  notifyTarget: string;
}

interface DocumentFormProps {
  onSubmit: (values: FormValues, file: File | null) => void;
  uploading?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
  compact?: boolean;  // Nova propriedade para modo compacto
}

export const DocumentForm = ({ onSubmit, uploading = false, formRef, compact = false }: DocumentFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [notifyTarget, setNotifyTarget] = useState(NOTIFICATION_TARGETS[0].value);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values: FormValues = {
      title: title,
      description: description,
      documentType: documentType,
      notifyTarget: notifyTarget,
    };
    onSubmit(values, file);
  };

  return (
    <form 
      ref={formRef}
      onSubmit={handleFormSubmit} 
      className={compact ? "space-y-2" : "space-y-4"}
    >
      {/* Título */}
      <div className="space-y-1">
        <Label 
          htmlFor="title" 
          className={compact ? "text-sm" : ""}
        >
          Título
        </Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={compact ? "h-8 text-sm" : ""}
          placeholder="Título do documento"
          required
        />
      </div>

      {/* Descrição */}
      <div className="space-y-1">
        <Label 
          htmlFor="description" 
          className={compact ? "text-sm" : ""}
        >
          Descrição (opcional)
        </Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={compact ? "min-h-[60px] text-sm" : "min-h-[80px]"}
          placeholder="Descrição do documento"
        />
      </div>

      {/* Tipo de Documento */}
      <div className="space-y-1">
        <Label 
          htmlFor="documentType" 
          className={compact ? "text-sm" : ""}
        >
          Tipo de documento
        </Label>
        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger 
            id="documentType" 
            className={compact ? "h-8 text-sm" : ""}
          >
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upload de Arquivo */}
      <div className="space-y-1">
        <Label 
          htmlFor="file" 
          className={compact ? "text-sm" : ""}
        >
          Arquivo
        </Label>
        <div className="flex items-center">
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('file')?.click()}
            className={compact ? "h-8 text-xs" : ""}
          >
            <Upload className={`mr-2 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
            Selecionar arquivo
          </Button>
          <span className={`ml-2 truncate ${compact ? "text-xs" : "text-sm"} text-gray-500`}>
            {file ? file.name : "Nenhum arquivo selecionado"}
          </span>
        </div>
      </div>

      {/* Destinatários */}
      <div className="space-y-1">
        <Label 
          className={compact ? "text-sm" : ""}
        >
          Destinatários
        </Label>
        
        {/* Layout compacto para as opções de notificação */}
        <RadioGroup 
          value={notifyTarget} 
          onValueChange={setNotifyTarget}
          className={compact ? "flex space-x-4" : "space-y-2"}
        >
          {NOTIFICATION_TARGETS.map((target) => (
            <div key={target.value} className={compact ? "flex items-center space-x-1" : "flex items-center space-x-2"}>
              <RadioGroupItem value={target.value} id={`target-${target.value}`} />
              <Label 
                htmlFor={`target-${target.value}`}
                className={compact ? "text-xs" : ""}
              >
                {target.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Botão de envio */}
      <div className="pt-2">
        <Button 
          type="submit" 
          disabled={uploading || !file} 
          className="w-full"
          size={compact ? "sm" : "default"}
        >
          {uploading ? 'Enviando...' : 'Enviar documento'}
        </Button>
      </div>
    </form>
  );
};
