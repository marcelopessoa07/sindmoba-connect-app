
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import { getCategoryLabel, formatFileSize, formatDate } from './documentUtils';

interface DocumentListItemProps {
  document: any;
  onView: (document: any) => void;
  onDelete: (document: any) => void;
}

const DocumentListItem = ({ document, onView, onDelete }: DocumentListItemProps) => {
  return (
    <div className="border rounded-lg bg-white shadow-sm p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">{document.title}</h3>
          {document.description && (
            <p className="text-sm text-gray-600">{document.description}</p>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span>Categoria: {getCategoryLabel(document.category)}</span>
            <span>•</span>
            {document.file_size > 0 && (
              <>
                <span>Tamanho: {formatFileSize(document.file_size)}</span>
                <span>•</span>
              </>
            )}
            <span>Enviado em: {formatDate(document.created_at)}</span>
          </div>
        </div>
        
        <div className="mt-3 sm:mt-0 flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center"
            onClick={() => onView(document)}
          >
            <Eye className="mr-1 h-4 w-4" />
            <span>Visualizar</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center text-red-500 hover:text-red-700"
            onClick={() => onDelete(document)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            <span>Excluir</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentListItem;
