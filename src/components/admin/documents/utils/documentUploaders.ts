
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FormValues } from '../DocumentForm';
import { Member } from '../recipients/RecipientSelector';
import { SpecialtyType } from '../recipients/SpecialtySelector';

export const uploadDocument = async (
  values: FormValues, 
  file: File | null,
  selectedSpecialties: SpecialtyType[] = [],
  selectedMembers: Member[] = []
) => {
  if (!file) {
    throw new Error('Por favor, selecione um arquivo para enviar.');
  }

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não está autenticado.');
  }

  try {
    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // 2. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // 3. Insert document record
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: values.title,
        description: values.description,
        category: values.category,
        file_url: publicUrlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        created_by: user.id
      })
      .select()
      .single();

    if (documentError) {
      throw documentError;
    }

    // Determine recipients based on what was selected
    if (selectedSpecialties.length > 0) {
      // Create recipient records for each specialty
      for (const specialty of selectedSpecialties) {
        const { error: recipientError } = await supabase
          .from('document_recipients')
          .insert({
            document_id: document.id,
            recipient_type: 'specialty',
            specialty: specialty
          });

        if (recipientError) {
          throw recipientError;
        }
      }
    } else if (selectedMembers.length > 0) {
      // Create recipient records for each member
      for (const member of selectedMembers) {
        const { error: recipientError } = await supabase
          .from('document_recipients')
          .insert({
            document_id: document.id,
            recipient_type: 'member',
            recipient_id: member.id
          });

        if (recipientError) {
          throw recipientError;
        }
      }
    } else {
      // Default to "all" if no specific recipients were selected
      const { error: recipientError } = await supabase
        .from('document_recipients')
        .insert({
          document_id: document.id,
          recipient_type: 'all'
        });

      if (recipientError) {
        throw recipientError;
      }
    }

    return document;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const uploadDocumentToAll = async (
  values: FormValues,
  file: File | null,
  userId: string,
  toast: ReturnType<typeof useToast>['toast']
) => {
  if (!file) {
    toast({
      title: 'Erro no envio',
      description: 'Por favor, selecione um arquivo para enviar.',
      variant: 'destructive',
    });
    return null;
  }

  try {
    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // 2. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // 3. Insert document record
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: values.title,
        description: values.description,
        category: values.category,
        file_url: publicUrlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        created_by: userId
      })
      .select()
      .single();

    if (documentError) {
      throw documentError;
    }

    // 4. Create recipient record for "all"
    const { error: recipientError } = await supabase
      .from('document_recipients')
      .insert({
        document_id: document.id,
        recipient_type: 'all',
      });

    if (recipientError) {
      throw recipientError;
    }

    return document;
  } catch (error: any) {
    console.error('Error uploading document:', error);
    toast({
      title: 'Erro no envio',
      description: error.message || 'Houve um erro ao enviar o documento.',
      variant: 'destructive',
    });
    return null;
  }
};

export const uploadDocumentToSpecialties = async (
  values: FormValues,
  file: File | null,
  selectedSpecialties: ('pml' | 'pol')[],
  userId: string,
  toast: ReturnType<typeof useToast>['toast']
) => {
  if (!file) {
    toast({
      title: 'Erro no envio',
      description: 'Por favor, selecione um arquivo para enviar.',
      variant: 'destructive',
    });
    return null;
  }

  try {
    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // 2. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // 3. Insert document record
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: values.title,
        description: values.description,
        category: values.category,
        file_url: publicUrlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        created_by: userId
      })
      .select()
      .single();

    if (documentError) {
      throw documentError;
    }

    // 4. Create recipient records for each specialty
    for (const specialty of selectedSpecialties) {
      const { error: recipientError } = await supabase
        .from('document_recipients')
        .insert({
          document_id: document.id,
          recipient_type: 'specialty',
          specialty: specialty
        });

      if (recipientError) {
        throw recipientError;
      }
    }

    return document;
  } catch (error: any) {
    console.error('Error uploading document:', error);
    toast({
      title: 'Erro no envio',
      description: error.message || 'Houve um erro ao enviar o documento.',
      variant: 'destructive',
    });
    return null;
  }
};

export const uploadDocumentToMembers = async (
  values: FormValues,
  file: File | null,
  selectedMembers: string[],
  userId: string,
  toast: ReturnType<typeof useToast>['toast']
) => {
  if (!file) {
    toast({
      title: 'Erro no envio',
      description: 'Por favor, selecione um arquivo para enviar.',
      variant: 'destructive',
    });
    return null;
  }

  try {
    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // 2. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // 3. Insert document record
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: values.title,
        description: values.description,
        category: values.category,
        file_url: publicUrlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        created_by: userId
      })
      .select()
      .single();

    if (documentError) {
      throw documentError;
    }

    // 4. Create recipient records for each member
    for (const memberId of selectedMembers) {
      const { error: recipientError } = await supabase
        .from('document_recipients')
        .insert({
          document_id: document.id,
          recipient_type: 'member',
          recipient_id: memberId
        });

      if (recipientError) {
        throw recipientError;
      }
    }

    return document;
  } catch (error: any) {
    console.error('Error uploading document:', error);
    toast({
      title: 'Erro no envio',
      description: error.message || 'Houve um erro ao enviar o documento.',
      variant: 'destructive',
    });
    return null;
  }
};
