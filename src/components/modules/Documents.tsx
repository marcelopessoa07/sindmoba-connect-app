
import { useState, useEffect } from 'react';
import { File } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';

interface Document {
  id: string;
  title: string;
  description: string;
  category: 'statute' | 'minutes' | 'agreements' | 'official';
  created_at: string;
  file_size: number;
  file_type: string;
  file_url: string;
}

const Documents = () => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching documents:', error);
          return;
        }

        setDocuments(data || []);
      } catch (error) {
        console.error('Error in documents fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const getCategoryName = (category: Document['category']) => {
    switch (category) {
      case 'statute':
        return 'Estatuto do SINDMOBA';
      case 'minutes':
        return 'Atas de Assembleias';
      case 'agreements':
        return 'Convênios e Acordos';
      case 'official':
        return 'Comunicados Oficiais';
      default:
        return 'Outros';
    }
  };

  // Format date from ISO to DD/MM/YYYY
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR');
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = filter === 'all' || doc.category === filter;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="sindmoba-container">
      <h2 className="mb-6">Documentos e Arquivos</h2>
      
      <div className="mb-6 space-y-4">
        <Input
          placeholder="Buscar documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="statute">Estatuto do SINDMOBA</SelectItem>
            <SelectItem value="minutes">Atas de Assembleias</SelectItem>
            <SelectItem value="agreements">Convênios e Acordos</SelectItem>
            <SelectItem value="official">Comunicados Oficiais</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredDocuments.length > 0 ? (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start">
                <div className="mr-4 rounded-lg bg-sindmoba-light p-3">
                  <File className="h-6 w-6 text-sindmoba-primary" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{doc.title}</h3>
                  <p className="text-gray-600 mb-2">{doc.description}</p>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                    <span>Categoria: {getCategoryName(doc.category)}</span>
                    <span>Data: {formatDate(doc.created_at)}</span>
                    <span>Tamanho: {formatFileSize(doc.file_size)}</span>
                    <span>Tipo: {doc.file_type}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <a 
                  href={doc.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mr-2 text-sm text-sindmoba-primary hover:underline"
                >
                  Visualizar
                </a>
                <a 
                  href={doc.file_url} 
                  download
                  className="text-sm text-sindmoba-primary hover:underline"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
          <p className="text-gray-500">Nenhum documento encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default Documents;
