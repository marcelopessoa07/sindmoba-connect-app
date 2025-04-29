
import { MessageSquare, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyDocumentsListProps {
  onUpload: () => void;
}

const EmptyDocumentsList = ({ onUpload }: EmptyDocumentsListProps) => {
  return (
    <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma comunicação</h3>
      <p className="mt-1 text-sm text-gray-500">
        Não há comunicações ou documentos disponíveis. Comece enviando uma nova comunicação.
      </p>
      <div className="mt-6">
        <Button onClick={onUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Enviar Comunicação
        </Button>
      </div>
    </div>
  );
};

export default EmptyDocumentsList;
