
import { useState } from 'react';
import { File } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Document {
  id: number;
  title: string;
  description: string;
  category: 'statute' | 'minutes' | 'agreements' | 'official';
  date: string;
  fileSize: string;
  fileType: string;
}

const Documents = () => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Mocked documents data
  const [documents] = useState<Document[]>([
    {
      id: 1,
      title: 'Estatuto do SINDMOBA',
      description: 'Documento oficial com as regras e normas do sindicato.',
      category: 'statute',
      date: '10/01/2022',
      fileSize: '1.2 MB',
      fileType: 'PDF'
    },
    {
      id: 2,
      title: 'Ata da Assembleia Geral de Março/2025',
      description: 'Registro da Assembleia Geral realizada em 15/03/2025.',
      category: 'minutes',
      date: '20/03/2025',
      fileSize: '850 KB',
      fileType: 'PDF'
    },
    {
      id: 3,
      title: 'Acordo Coletivo 2025',
      description: 'Acordo coletivo de trabalho firmado entre o SINDMOBA e o Governo do Estado da Bahia.',
      category: 'agreements',
      date: '05/02/2025',
      fileSize: '1.5 MB',
      fileType: 'PDF'
    },
    {
      id: 4,
      title: 'Comunicado Oficial - Ajustes no Plano de Saúde',
      description: 'Informações sobre as alterações realizadas no plano de saúde dos peritos.',
      category: 'official',
      date: '12/04/2025',
      fileSize: '500 KB',
      fileType: 'PDF'
    },
    {
      id: 5,
      title: 'Ata da Assembleia Extraordinária de Abril/2025',
      description: 'Registro da Assembleia Extraordinária realizada em 05/04/2025.',
      category: 'minutes',
      date: '10/04/2025',
      fileSize: '780 KB',
      fileType: 'PDF'
    }
  ]);

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

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = filter === 'all' || doc.category === filter;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
      
      <div className="space-y-4">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => (
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
                    <span>Data: {doc.date}</span>
                    <span>Tamanho: {doc.fileSize}</span>
                    <span>Tipo: {doc.fileType}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button className="mr-2 text-sm text-sindmoba-primary hover:underline">
                  Visualizar
                </button>
                <button className="text-sm text-sindmoba-primary hover:underline">
                  Download
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <p className="text-gray-500">Nenhum documento encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
