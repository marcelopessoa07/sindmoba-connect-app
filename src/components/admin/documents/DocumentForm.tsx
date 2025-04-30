
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/FileUploader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { RecipientSelector } from './recipients/RecipientSelector';
import { SpecialtySelector } from './recipients/SpecialtySelector';

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Título é obrigatório.",
  }),
  description: z.string().optional(),
  category: z.string().min(1, {
    message: "Categoria é obrigatória.",
  }),
});

export type FormData = z.infer<typeof formSchema>;

interface DocumentFormProps {
  onSubmit: (values: FormData, file: File | null) => Promise<void>;
  uploading: boolean;
}

export const DocumentForm = ({ onSubmit, uploading }: DocumentFormProps) => {
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
    },
  });

  const handleFileUpload = (file: File | null) => {
    setFile(file);
  };

  const submitForm = (values: FormData) => {
    onSubmit(values, file);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitForm)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título do documento" {...field} disabled={uploading} />
              </FormControl>
              <FormMessage />
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
                  placeholder="Descrição do documento"
                  className="resize-none"
                  {...field}
                  disabled={uploading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={uploading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fileCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Selecione a categoria mais adequada para o documento.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Arquivo</FormLabel>
            <FormControl>
              <FileUploader
                bucket="documents"
                acceptedFileTypes={[
                  'application/pdf',
                  'image/jpeg',
                  'image/png',
                  'image/gif',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'application/vnd.ms-powerpoint',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                ]}
                maxFileSize={10} // 10MB
                onFileUploaded={handleFileUpload}
              />
            </FormControl>
            <FormDescription>
              Selecione o arquivo a ser enviado.
            </FormDescription>
            <FormMessage />
          </FormItem>
        </div>

        <Button type="submit" disabled={uploading}>
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar Documento
        </Button>
      </form>
    </Form>
  );
};

// Make fileCategories available for reuse
export const fileCategories = [
  { value: 'legal', label: 'Documentos Legais' },
  { value: 'communication', label: 'Comunicados' },
  { value: 'report', label: 'Relatórios' },
  { value: 'meeting', label: 'Atas de Reunião' },
  { value: 'financial', label: 'Documentos Financeiros' },
  { value: 'other', label: 'Outros' }
];
