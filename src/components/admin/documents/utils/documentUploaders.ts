
import { supabase } from '@/integrations/supabase/client';
import { FormValues } from '../DocumentForm';
import { Member } from '../recipients/RecipientSelector';
import { SpecialtyType } from '../recipients/SpecialtySelector';

/**
 * Uploads a document file to Supabase Storage
 * 
 * @param file The file to upload
 * @param userId The ID of the user uploading the file
 * @returns The URL of the uploaded file
 */
export const uploadDocumentFile = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase
    .storage
    .from('documents')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Error uploading document: ${error.message}`);
  }

  // Get the public URL for the file
  const { data: urlData } = supabase
    .storage
    .from('documents')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

/**
 * Uploads a document to the database
 */
export const uploadDocument = async (
  values: FormValues, 
  file: File | null,
  userId: string,
  selectedSpecialties: SpecialtyType[],
  selectedMembers: Member[]
) => {
  if (!file) {
    throw new Error("No file provided");
  }

  // Upload the file to storage
  const fileUrl = await uploadDocumentFile(file, userId);

  // Create document record in the database
  const documentData = {
    title: values.title,
    description: values.description || null,
    category: values.documentType,
    file_url: fileUrl,
    file_type: file.type,
    file_size: file.size,
    created_by: userId
  };

  const { data, error } = await supabase
    .from('documents')
    .insert(documentData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const documentId = data.id;

  // Add specialty recipients if any
  if (selectedSpecialties.length > 0) {
    const specialtyRecipients = selectedSpecialties.map(specialty => ({
      document_id: documentId,
      recipient_type: 'specialty',
      specialty: specialty
    }));

    const { error: specialtyError } = await supabase
      .from('document_recipients')
      .insert(specialtyRecipients);

    if (specialtyError) {
      console.error('Error adding specialty recipients:', specialtyError);
    }
  }

  // Add member recipients if any
  if (selectedMembers.length > 0) {
    const memberRecipients = selectedMembers.map(member => ({
      document_id: documentId,
      recipient_id: member.id,
      recipient_type: 'user'
    }));

    const { error: memberError } = await supabase
      .from('document_recipients')
      .insert(memberRecipients);

    if (memberError) {
      console.error('Error adding member recipients:', memberError);
    }
  }

  // If notifyTarget is 'all', add an 'all' recipient type
  if (values.notifyTarget === 'all') {
    const { error: allError } = await supabase
      .from('document_recipients')
      .insert({
        document_id: documentId,
        recipient_type: 'all'
      });

    if (allError) {
      console.error('Error adding all recipients:', allError);
    }
  }

  return data;
};
