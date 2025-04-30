
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Import the extracted components
import UploadDialog from '@/components/admin/documents/UploadDialog';
import DocumentListItem from '@/components/admin/documents/DocumentListItem';
import DocumentPreviewDialog from '@/components/admin/documents/DocumentPreviewDialog';
import DeleteConfirmationDialog from '@/components/admin/documents/DeleteConfirmationDialog';
import EmptyDocumentsList from '@/components/admin/documents/EmptyDocumentsList';

const AdminDocumentsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const { toast } = useToast();

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

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Erro ao carregar documentos',
        description: 'Não foi possível carregar a lista de documentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const viewDocument = async (document: any) => {
    try {
      setSelectedDocument(document);
      
      if (document.file_url) {
        try {
          console.log("Attempting to get signed URL for:", document.file_url);
          
          // Extract just the filename from the full URL path - IMPROVED
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
          
          // Generate a temporary URL for file viewing/downloading with longer expiry
          const { data, error } = await supabase
            .storage
            .from(bucketName)
            .createSignedUrl(filePath, 1800); // Increased expiry to 30 minutes
          
          if (error) {
            console.error('Storage error:', error);
            throw error;
          }
          
          console.log("Signed URL generated successfully:", data.signedUrl);
          setDocumentUrl(data?.signedUrl || '');
        } catch (storageError) {
          console.error('Error generating document URL:', storageError);
          setDocumentUrl('');
          
          toast({
            title: 'Erro ao gerar URL do documento',
            description: 'Não foi possível visualizar o documento.',
            variant: 'destructive',
          });
        }
      } else {
        setDocumentUrl('');
      }
      
      // Only after all state updates are done, open the dialog
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error generating document URL:', error);
      toast({
        title: 'Erro ao gerar URL do documento',
        description: 'Não foi possível visualizar o documento.',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (document: any) => {
    setDocumentToDelete(document);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      // If there's a file, delete it from storage
      if (documentToDelete.file_url) {
        let bucketName = 'documents';
        let filePath = documentToDelete.file_url;
        
        // Process the file URL to extract the correct path
        if (documentToDelete.file_url.includes('/storage/v1/object/public/')) {
          const parts = documentToDelete.file_url.split('/storage/v1/object/public/');
          if (parts.length > 1) {
            const afterBucket = parts[1]; 
            const bucketAndPath = afterBucket.split('/', 2);
            if (bucketAndPath.length > 0) {
              bucketName = bucketAndPath[0];
              if (bucketAndPath.length > 1) {
                filePath = afterBucket.substring(bucketAndPath[0].length + 1);
              }
            }
          }
        }
        
        console.log(`Attempting to delete file from bucket: ${bucketName}, path: ${filePath}`);
        
        const { error: storageError } = await supabase
          .storage
          .from(bucketName)
          .remove([filePath]);
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with deleting the record even if file deletion fails
        }
      }

      // Delete related records in document_recipients
      const { error: recipientsError } = await supabase
        .from('document_recipients')
        .delete()
        .eq('document_id', documentToDelete.id);
      
      if (recipientsError) {
        console.error('Error deleting document recipients:', recipientsError);
      }

      // Delete the document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentToDelete.id);

      if (error) {
        throw error;
      }

      // Update the local state
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      
      toast({
        title: 'Documento excluído',
        description: 'O documento foi excluído com sucesso.',
      });

      // Close the dialogs if they're open
      setIsDeleteDialogOpen(false);
      if (selectedDocument && selectedDocument.id === documentToDelete.id) {
        setIsPreviewDialogOpen(false);
      }
      
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Erro ao excluir documento',
        description: 'Não foi possível excluir o documento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Handle document preview dialog deletion button
  const handlePreviewDeleteClick = () => {
    setIsPreviewDialogOpen(false);
    setDocumentToDelete(selectedDocument);
    setIsDeleteDialogOpen(true);
  };

  return (
    <AdminLayout title="Gerenciamento de Comunicações e Documentos">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Gerencie as comunicações e documentos disponibilizados aos associados.
          </p>
          
          <Button onClick={() => setIsDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Enviar Comunicação
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando comunicações e documentos...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((document) => (
              <DocumentListItem
                key={document.id}
                document={document}
                onView={viewDocument}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>
        ) : (
          <EmptyDocumentsList onUpload={() => setIsDialogOpen(true)} />
        )}
      </div>
      
      {/* Conditionally render dialogs to prevent infinite render loops */}
      {isDialogOpen && (
        <UploadDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onUploadSuccess={fetchDocuments}
        />
      )}
      
      {isPreviewDialogOpen && selectedDocument && (
        <DocumentPreviewDialog
          open={isPreviewDialogOpen}
          onOpenChange={setIsPreviewDialogOpen}
          document={selectedDocument}
          documentUrl={documentUrl}
          onDelete={handlePreviewDeleteClick}
        />
      )}

      {isDeleteDialogOpen && documentToDelete && (
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          documentTitle={documentToDelete?.title}
          onConfirm={handleDeleteDocument}
        />
      )}
    </AdminLayout>
  );
};

export default AdminDocumentsPage;
