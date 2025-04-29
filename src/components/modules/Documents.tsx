
import { useState, useEffect } from 'react';
import { FileText, Download, Eye, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; 
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Function to format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return 'N/A';
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

// Function to format date
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('pt-BR', options);
};

const Documents = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (user) {
        // Filter documents based on recipient type
        const { data: profileData } = await supabase
          .from('profiles')
          .select('specialty, role')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          const userSpecialty = profileData.specialty;
          const userRole = profileData.role;
          
          // If user is admin, show all documents
          if (userRole === 'admin') {
            setDocuments(data || []);
          } else {
            // Get all document IDs that are targeted for this user
            const { data: recipientData, error: recipientError } = await supabase
              .from('document_recipients')
              .select('document_id')
              .or(`recipient_type.eq.all,specialty.eq.${userSpecialty}`);
            
            if (recipientError) {
              throw recipientError;
            }
            
            const accessibleDocumentIds = recipientData?.map(item => item.document_id) || [];
            
            // Filter documents that the current user has access to
            const filteredDocuments = data?.filter(doc => 
              accessibleDocumentIds.includes(doc.id)
            ) || [];
            
            setDocuments(filteredDocuments);
          }
        } else {
          // Fall back to showing all documents if no profile found
          setDocuments(data || []);
        }
      } else {
        // Non-authenticated user, show nothing or public documents only
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDocument = async (document: any) => {
    try {
      setSelectedDocument(document);
      
      if (document.file_url) {
        // Generate a temporary URL for file viewing/downloading
        const { data, error } = await supabase
          .storage
          .from('documents')
          .createSignedUrl(document.file_url, 60);
        
        if (error) {
          throw error;
        }
        
        setDocumentUrl(data?.signedUrl || '');
      } else {
        setDocumentUrl('');
      }
      
      setIsDialogOpen(true);
      
      // Record document view in recipients table if applicable
      if (user) {
        await supabase
          .from('document_recipients')
          .update({ viewed_at: new Date().toISOString() })
          .match({ document_id: document.id, recipient_id: user.id });
      }
    } catch (error) {
      console.error('Error generating document URL:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: {[key: string]: string} = {
      'estatuto': 'Estatuto do SINDMOBA',
      'atas': 'Atas de assembleias',
      'convenios': 'Convênios e acordos coletivos',
      'comunicados': 'Comunicados oficiais',
      'outros': 'Outros documentos'
    };
    return categories[category] || category;
  };

  const documentsByCategory: {[key: string]: any[]} = {
    all: documents
  };

  // Group documents by category
  documents.forEach(doc => {
    if (!documentsByCategory[doc.category]) {
      documentsByCategory[doc.category] = [];
    }
    documentsByCategory[doc.category].push(doc);
  });

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'estatuto', label: 'Estatuto' },
    { id: 'atas', label: 'Atas' },
    { id: 'convenios', label: 'Convênios' },
    { id: 'comunicados', label: 'Comunicados' },
    { id: 'outros', label: 'Outros' }
  ];

  return (
    <div className="sindmoba-container space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Documentos do SINDMOBA</h1>
        <p className="text-muted-foreground">
          Acesse os documentos oficiais, estatutos, comunicados e outros arquivos importantes do sindicato.
        </p>
      </div>
      
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-4">
          {categories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              disabled={!documentsByCategory[category.id] || documentsByCategory[category.id].length === 0}
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p>Carregando documentos...</p>
              </div>
            ) : documentsByCategory[category.id]?.length > 0 ? (
              documentsByCategory[category.id].map(doc => (
                <div 
                  key={doc.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-white shadow-sm rounded-lg border p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-sindmoba-light p-2 rounded">
                      <FileText className="text-sindmoba-primary h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
                        <span>{getCategoryLabel(doc.category)}</span>
                        {doc.file_size > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Publicado em: {formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center"
                      onClick={() => viewDocument(doc)}
                    >
                      {doc.file_url ? (
                        <>
                          <Eye className="mr-1 h-4 w-4" />
                          <span>Visualizar</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-1 h-4 w-4" />
                          <span>Ver detalhes</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border rounded-lg bg-gray-50">
                <FileText className="mx-auto h-10 w-10 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum documento</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Não há documentos disponíveis nesta categoria.
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {selectedDocument && (
              <div className="flex flex-col items-center justify-center">
                {selectedDocument.description && (
                  <p className="mb-4 text-gray-600">{selectedDocument.description}</p>
                )}
                
                {documentUrl && selectedDocument?.file_type?.includes('pdf') ? (
                  <iframe 
                    src={`${documentUrl}#toolbar=0`}
                    className="w-full h-[500px] border rounded"
                    title={selectedDocument?.title}
                  />
                ) : documentUrl ? (
                  <p className="mb-4 text-center">
                    Este tipo de arquivo não pode ser pré-visualizado.
                  </p>
                ) : (
                  <div className="text-center p-4">
                    <p className="mb-2">Este é um documento sem arquivo anexado.</p>
                    <p className="text-sm text-gray-500">
                      Contate o administrador para mais informações.
                    </p>
                  </div>
                )}
                
                {documentUrl && (
                  <Button asChild className="mt-4">
                    <a href={documentUrl} download={selectedDocument?.title} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Arquivo
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;
