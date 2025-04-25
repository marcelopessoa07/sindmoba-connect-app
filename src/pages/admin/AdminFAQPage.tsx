
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  created_at: string;
  is_active?: boolean;
  order_index?: number;
  updated_at?: string;
}

const AdminFAQPage = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null as string | null,
    question: '',
    answer: '',
    category: '',
  });
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFaqs(data as FAQ[]);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as perguntas frequentes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value === "no-category" ? '' : value,
    });
  };

  const resetForm = () => {
    setFormData({
      id: null,
      question: '',
      answer: '',
      category: '',
    });
    setEditMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editMode && formData.id) {
        // Update existing FAQ
        const { error } = await supabase
          .from('faq_items')
          .update({
            question: formData.question,
            answer: formData.answer,
            category: formData.category || null,
          })
          .eq('id', formData.id);

        if (error) throw error;

        toast({
          title: 'Atualizado',
          description: 'Pergunta atualizada com sucesso.',
        });
      } else {
        // Create new FAQ
        const { error } = await supabase.from('faq_items').insert([
          {
            question: formData.question,
            answer: formData.answer,
            category: formData.category || null,
          },
        ]);

        if (error) throw error;

        toast({
          title: 'Adicionado',
          description: 'Nova pergunta adicionada com sucesso.',
        });
      }

      resetForm();
      fetchFAQs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a pergunta.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setFormData({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
    });
    setEditMode(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir esta pergunta?')) {
      return;
    }

    try {
      const { error } = await supabase.from('faq_items').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Excluído',
        description: 'Pergunta excluída com sucesso.',
      });

      fetchFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a pergunta.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout title="Gerenciar FAQ">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{editMode ? 'Editar Pergunta' : 'Adicionar Nova Pergunta'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="question" className="block font-medium">
                  Pergunta
                </label>
                <Input
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="answer" className="block font-medium">
                  Resposta
                </label>
                <Textarea
                  id="answer"
                  name="answer"
                  value={formData.answer}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="block font-medium">
                  Categoria
                </label>
                <Select 
                  value={formData.category || "no-category"} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-category">Sem categoria</SelectItem>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="documentos">Documentos</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="associacao">Associação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-sindmoba-primary hover:bg-sindmoba-secondary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : editMode ? 'Atualizar' : 'Adicionar'}
                </Button>
                {editMode && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetForm}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perguntas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : faqs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhuma pergunta cadastrada.
              </p>
            ) : (
              <div className="space-y-6">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{faq.question}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(faq)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(faq.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-2">{faq.answer}</p>
                    {faq.category && (
                      <div className="text-xs bg-muted inline-block px-2 py-1 rounded">
                        {faq.category}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFAQPage;
