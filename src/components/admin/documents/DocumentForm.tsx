
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { FileUploader } from '@/components/FileUploader';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecipientSelector, Member } from './recipients/RecipientSelector';
import { SpecialtyType } from './recipients/SpecialtySelector';
import { useForm } from 'react-hook-form';

// Export file categories for use in other components
export const fileCategories = [
  { value: 'estatuto', label: 'Estatuto do SINDMOBA' },
  { value: 'atas', label: 'Atas de assembleias' },
  { value: 'convenios', label: 'Convênios e acordos coletivos' },
  { value: 'comunicados', label: 'Comunicados oficiais' },
  { value: 'outros', label: 'Outros documentos' }
];

export interface FormValues {
  title: string;
  description: string;
  category: string;
  recipientType: string;
}

interface DocumentFormProps {
  onSubmit: (values: FormValues, file: File | null) => Promise<void>;
  uploading: boolean;
}

export const DocumentForm = ({ onSubmit, uploading }: DocumentFormProps) => {
  const [selectedSpecialties, setSelectedSpecialties] = useState<SpecialtyType[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [file, setFile] = useState<File | null>(null);
  
  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      category: 'comunicados',
      recipientType: 'all'
    }
  });

  const handleFileChange = (uploadedFile: File | null) => {
    console.log("File selected:", uploadedFile);
    setFile(uploadedFile);
  };

  const handleSpecialtyChange = (specialty: SpecialtyType) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(item => item !== specialty)
        : [...prev, specialty]
    );
  };

  const handleMemberSelection = (member: Member) => {
    setSelectedMembers(prev => {
      const isMemberSelected = prev.some(m => m.id === member.id);
      if (isMemberSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit(values, file);
  };

  const recipientTypeValue = form.watch('recipientType');

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título</FormLabel>
            <FormControl>
              <Input 
                placeholder="Título do documento"
                disabled={uploading}
                required
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Descrição opcional do documento"
                disabled={uploading}
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <Select 
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={uploading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {fileCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="recipientType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Destinatários</FormLabel>
            <FormControl>
              <RecipientSelector
                recipientType={field.value}
                onRecipientTypeChange={field.onChange}
                selectedSpecialties={selectedSpecialties}
                onSpecialtyChange={handleSpecialtyChange}
                selectedMembers={selectedMembers}
                onMemberSelection={handleMemberSelection}
                disabled={uploading}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <Label>Arquivo</Label>
        <FileUploader 
          bucket="documents"
          acceptedFileTypes={[
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ]}
          maxFileSize={10}
          onFileUploaded={handleFileChange}
          onUploadProgress={(isUploading) => {}}
        />
        {file && (
          <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-gray-50">
            <span className="truncate text-sm">{file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="pt-4 flex justify-end space-x-2">
        <Button type="submit" disabled={uploading}>
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {uploading ? 'Enviando...' : 'Enviar documento'}
        </Button>
      </div>
    </form>
  );
};

// Make FormValues available for reuse without redeclaring
export type { FormValues };
