import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Eye, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getCategoryLabel } from '@/components/admin/documents/documentUtils';

interface Document {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  file_url: string;
  file_type: string;
  category: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          console.log('User not authenticated, fetching only public documents');
          const { data: publicDocs, error: publicError } = await supabase
            .from('documents')
            .select(`
              id,
              title,
              description,
              created_at,
              file_url,
              file_type,
              category
            `)
            .eq('category', 'estatuto')
            .order('created_at', { ascending: false });
            
          if (publicError) throw publicError;
          setDocuments(publicDocs || []);
          return;
        }

        console.log('Fetching documents for user:', user.id);
        
        // Get user specialty
        const { data: profile } = await supabase
          .from('profiles')
          .select('specialty')
          .eq('id', user.id)
          .single();
          
        const userSpecialty = profile?.specialty;
        console.log('User specialty:', userSpecialty);

        // This query fetches:
        // 1. All documents where recipient_type is 'all'
        // 2. Documents targeted to user's specialty
        // 3. Documents targeted specifically to this user
        const { data: documentRecipients, error: recipientsError } = await supabase
          .from('document_recipients')
          .select(`
            document_id,
            recipient_type,
            specialty,
            recipient_id
          `)
          .or(`recipient_type.eq.all,and(recipient_type.eq.specialty,specialty.eq.${userSpecialty || ''}),and(recipient_type.eq.specific,recipient_id.eq.${user.id})`);

        if (recipientsError) {
          console.error('Error fetching document recipients:', recipientsError);
          throw recipientsError;
        }

        console.log('Document recipients found:', documentRecipients?.length);
        
        if (!documentRecipients || documentRecipients.length === 0) {
          setDocuments([]);
          setLoading(false);
          return;
        }

        // Extract document IDs
        const documentIds = documentRecipients.map(dr => dr.document_id);
        console.log('Document IDs to fetch:', documentIds);

        // Fetch the actual documents
        const { data: docs, error: docsError } = await supabase
          .from('documents')
          .select(`
            id,
            title,
            description,
            created_at,
            file_url,
            file_type,
            category
          `)
          .in('id', documentIds)
          .order('created_at', { ascending: false });

        if (docsError) throw docsError;
        
        console.log('Documents fetched successfully:', docs?.length);
        setDocuments(docs || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  // Filtering logic
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const viewDocument = async (document: Document) => {
    try {
      setSelectedDocument(document);
      
      if (document.file_url) {
        try {
          console.log("Attempting to get signed URL for:", document.file_url);
          
          // Extract just the filename from the full URL path
          let filePath = document.file_url;
          let bucketName = 'documents';
          
          // For URLs that have the full Supabase storage URL
          if (document.file_url.includes('supabase.co/storage/v1/object/public/')) {
            const parts = document.file_url.split('/storage/v1/object/public/');
            if (parts.length > 1) {
              const afterBucket = parts[1]; // 'documents/some-filename.pdf'
              const bucketAndPath = afterBucket.split('/', 2); // ['documents', 'some-filename.pdf']
              if (bucketAndPath.length > 0) {
                bucketName = bucketAndPath[0]; // 'documents'
                if (bucketAndPath.length > 1) {
                  filePath = afterBucket.substring(bucketAndPath[0].length + 1); // 'some-filename.pdf'
                } else {
                  filePath = ''; // empty path if no file was specified
                }
              }
            }
          }
          
          console.log("Extracted bucket:", bucketName);
          console.log("Extracted filePath:", filePath);
          
          if (!filePath) {
            console.error('Could not extract file path from URL:', document.file_url);
            throw new Error("Could not extract file path from URL");
          }
          
          // Generate a temporary URL for file viewing/downloading
          const { data, error } = await supabase
            .storage
            .from(bucketName)
            .createSignedUrl(filePath, 1800); // 30 minutes expiry
          
          if (error) {
            console.error('Storage error:', error);
            throw error;
          }
          
          console.log("Signed URL generated successfully:", data.signedUrl);
          setDocumentUrl(data?.signedUrl || null);
          
          // Open document in new tab
          if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
          }
        } catch (storageError) {
          console.error('Error generating document URL:', storageError);
          setDocumentUrl(null);
        }
      } else {
        setDocumentUrl(null);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  return (
    <div className="sindmoba-container">
      <h2 className="mb-2">Documentos e Comunicações</h2>
      <p className="text-gray-600 mb-6">
        Acesse os documentos e comunicações oficiais do SINDMOBA.
      </p>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar documentos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-64">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="estatuto">Estatuto do SINDMOBA</SelectItem>
                  <SelectItem value="atas">Atas de assembleias</SelectItem>
                  <SelectItem value="convenios">Convênios e acordos coletivos</SelectItem>
                  <SelectItem value="comunicados">Comunicados oficiais</SelectItem>
                  <SelectItem value="outros">Outros documentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredDocuments.length > 0 ? (
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <div 
                  key={document.id} 
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition flex justify-between items-center"
                >
                  <div className="flex items-start space-x-4">
                    <div className="rounded-md bg-blue-50 p-2">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">{document.title}</h3>
                      {document.description && (
                        <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(document.created_at)}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{getCategoryLabel(document.category)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => viewDocument(document)}
                    className="flex items-center bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum documento encontrado</h3>
              <p className="text-gray-500 mt-1">
                {searchTerm || categoryFilter !== 'all' 
                  ? "Tente ajustar os filtros para ver mais resultados." 
                  : "Não há documentos disponíveis para você neste momento."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Documents;
