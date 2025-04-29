import { useState, useEffect } from 'react';
import { FileText, Download, Eye, ExternalLink, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; 
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

// Extract filename from Supabase URL
const extractFilePath = (fileUrl: string): string => {
  if (!fileUrl) return '';
  
  try {
    // Handle if the URL is a full Supabase storage URL
    if (fileUrl.includes('supabase.co/storage/v1/object/public/')) {
      const bucketName = 'documents';
      const urlParts = fileUrl.split(`/storage/v1/object/public/${bucketName}/`);
      if (urlParts.length > 1) {
        return urlParts[1];
      } 
      return fileUrl;
    }
    return fileUrl;
  } catch (error) {
    console.error('Error extracting file path:', error);
    return fileUrl;
  }
};

// Define Message interface to work around TypeScript errors
interface Message {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  subject: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_system_message: boolean;
}

const Documents = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [fileError, setFileError] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
    if (user) {
      fetchMessages();
    }
  }, [user]);

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

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      
      if (!user) return;

      // Use type assertion to work around TypeScript error
      const { data, error } = await (supabase
        .from('messages') as any)
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const viewDocument = async (document: any) => {
    try {
      setSelectedDocument(document);
      setFileError(false);
      
      if (document.file_url) {
        try {
          console.log("Attempting to get signed URL for:", document.file_url);
          
          // Extract just the filename from the full URL path
          const filePath = extractFilePath(document.file_url);
          console.log("Extracted filePath:", filePath);
          
          if (!filePath) {
            throw new Error("Invalid file path");
          }
          
          // Generate a temporary URL for file viewing/downloading
          const { data, error } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(filePath, 60);
          
          if (error) {
            console.error('Storage error:', error);
            setDocumentUrl('');
            setFileError(true);
            
            toast({
              title: "Erro ao acessar o documento",
              description: "O arquivo não está disponível no storage.",
              variant: "destructive",
            });
          } else {
            console.log("Signed URL generated successfully:", data.signedUrl);
            setDocumentUrl(data?.signedUrl || '');
          }
        } catch (storageError) {
          console.error('Error generating document URL:', storageError);
          setDocumentUrl('');
          setFileError(true);
          
          toast({
            title: "Erro ao processar documento",
            description: "Ocorreu um erro ao tentar gerar o link para o documento.",
            variant: "destructive",
          });
        }
      } else {
        setDocumentUrl('');
        setFileError(true);
      }
      
      setIsDialogOpen(true);
      
      // Record document view in recipients table if applicable
      if (user && !fileError && document.file_url) {
        await supabase
          .from('document_recipients')
          .update({ viewed_at: new Date().toISOString() })
          .match({ document_id: document.id, recipient_id: user.id });
      }
    } catch (error) {
      console.error('Error handling document view:', error);
      toast({
        title: "Erro ao processar documento",
        description: "Ocorreu um erro ao tentar abrir o documento.",
        variant: "destructive",
      });
    }
  };

  const viewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsMessageDialogOpen(true);
    
    // Mark message as read if it hasn't been read yet
    if (!message.read_at && user) {
      updateMessageReadStatus(message.id);
    }
  };

  const updateMessageReadStatus = async (messageId: string) => {
    try {
      // Use type assertion to work around TypeScript error
      const { error } = await (supabase
        .from('messages') as any)
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
      
      if (error) {
        throw error;
      }
      
      // Update the local state
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, read_at: new Date().toISOString() } : msg
      ));
    } catch (error) {
      console.error('Error updating message read status:', error);
    }
  };

  const openDeleteDialog = (message: Message) => {
    setMessageToDelete(message);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      // Use type assertion to work around TypeScript error
      const { error } = await (supabase
        .from('messages') as any)
        .delete()
        .eq('id', messageToDelete.id);

      if (error) {
        throw error;
      }

      // Update local state
      setMessages(messages.filter(msg => msg.id !== messageToDelete.id));
      
      // Close dialogs
      setIsDeleteDialogOpen(false);
      if (selectedMessage && selectedMessage.id === messageToDelete.id) {
        setIsMessageDialogOpen(false);
      }
      
      toast({
        title: "Mensagem excluída",
        description: "A mensagem foi excluída com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Erro ao excluir mensagem",
        description: "Não foi possível excluir a mensagem. Tente novamente.",
        variant: "destructive"
      });
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
    { id: 'outros', label: 'Outros' },
    { id: 'messages', label: 'Mensagens' }
  ];

  const isUnread = (message: Message) => {
    return !message.read_at;
  };

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
              disabled={(category.id !== 'messages' && 
                (!documentsByCategory[category.id] || documentsByCategory[category.id].length === 0)) ||
                (category.id === 'messages' && (!user || messages.length === 0))
              }
            >
              {category.label}
              {category.id === 'messages' && messages.filter(isUnread).length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-red-500 text-white">
                  {messages.filter(isUnread).length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Documents tabs content */}
        {categories.filter(c => c.id !== 'messages').map(category => (
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
        
        {/* Messages tab content */}
        <TabsContent value="messages">
          {loadingMessages ? (
            <div className="text-center py-12">
              <p>Carregando mensagens...</p>
            </div>
          ) : messages.length > 0 ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow 
                      key={message.id}
                      className={isUnread(message) ? "bg-blue-50" : ""}
                    >
                      <TableCell>
                        {isUnread(message) ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Nova
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            Lida
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {message.subject}
                      </TableCell>
                      <TableCell>{formatDate(message.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center"
                            onClick={() => viewMessage(message)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            <span className="hidden sm:inline">Ver</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center text-red-500 hover:text-red-700"
                            onClick={() => openDeleteDialog(message)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            <span className="hidden sm:inline">Excluir</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma mensagem</h3>
              <p className="mt-1 text-sm text-gray-500">
                Você não tem mensagens no momento.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Document Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
            {selectedDocument?.description && (
              <DialogDescription>{selectedDocument.description}</DialogDescription>
            )}
          </DialogHeader>
          
          <div className="mt-4">
            {selectedDocument && (
              <div className="flex flex-col items-center justify-center">
                {documentUrl && selectedDocument?.file_type?.includes('pdf') ? (
                  <iframe 
                    src={`${documentUrl}#toolbar=0`}
                    className="w-full h-[500px] border rounded"
                    title={selectedDocument?.title}
                  />
                ) : documentUrl ? (
                  <p className="mb-4 text-center">
                    Este tipo de arquivo não pode ser pré-visualizado.
                    <br />
                    <a 
                      href={documentUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-sindmoba-primary hover:underline"
                    >
                      Clique para abrir em uma nova aba
                    </a>
                  </p>
                ) : (
                  <div className="text-center p-6 border border-dashed rounded-lg bg-gray-50">
                    <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
                    <p className="mb-2 font-medium">Este arquivo não está disponível.</p>
                    <p className="text-sm text-gray-500">
                      O arquivo pode ter sido removido ou não está mais disponível no storage.
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
      
      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="text-sm text-gray-500">
              <p>Enviado em: {selectedMessage ? formatDate(selectedMessage.created_at) : ''}</p>
            </div>
            
            <div className="prose max-w-none">
              {selectedMessage?.content && (
                <div dangerouslySetInnerHTML={{ __html: selectedMessage.content }} />
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => {
                  setIsMessageDialogOpen(false);
                  openDeleteDialog(selectedMessage!);
                }}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Excluir Mensagem
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mensagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
              {messageToDelete?.subject && (
                <p className="mt-2 font-medium text-foreground">"{messageToDelete.subject}"</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMessage}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Documents;
