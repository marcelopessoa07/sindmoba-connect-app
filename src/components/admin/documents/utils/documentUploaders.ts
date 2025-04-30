
import { supabase } from '@/integrations/supabase/client';
import { FormValues } from '../DocumentForm';
import { Member } from '../recipients/RecipientSelector';
import { SpecialtyType } from '../recipients/SpecialtySelector';

export async function uploadDocument(
  values: FormValues, 
  file: File | null,
  selectedSpecialties: SpecialtyType[],
  selectedMembers: Member[]
) {
  let fileUrl = '';
  let fileType = '';
  let fileSize = 0;
  const now = new Date().toISOString();

  try {
    // Upload file if provided
    if (file) {
      const fileExt = file.name.split('.').pop();
      const uniquePrefix = Math.random().toString(36).substring(2, 10);
      const filePath = `documents/${uniquePrefix}_${Date.now()}.${fileExt}`;
      
      console.log("Uploading file to:", filePath);
      console.log("File name:", file.name);
      console.log("File size:", file.size);
      console.log("File type:", file.type);
      
      const { error: uploadError, data: uploadData } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("File upload error:", uploadError);
        throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
      }

      // Get the public URL for the file
      const { data: urlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(filePath);

      fileUrl = urlData.publicUrl;
      fileType = file.type;
      fileSize = file.size;
      
      console.log("File uploaded successfully. Public URL:", fileUrl);
    }

    // Save document to database
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: values.title,
        description: values.description,
        category: values.category,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        created_at: now,
        updated_at: now
      })
      .select('id')
      .single();

    if (documentError) {
      throw documentError;
    }

    // Handle recipients based on selection type
    if (documentData?.id) {
      if (values.recipientType === 'all') {
        // Add document for all users
        const { error: recipientError } = await supabase
          .from('document_recipients')
          .insert({
            document_id: documentData.id,
            recipient_type: 'all',
            created_at: now
          });

        if (recipientError) {
          console.error("Error adding recipients:", recipientError);
        }
      } 
      else if (values.recipientType === 'specialty' && selectedSpecialties.length > 0) {
        // Add document for each valid specialty
        for (const specialty of selectedSpecialties) {
          const { error: recipientError } = await supabase
            .from('document_recipients')
            .insert({
              document_id: documentData.id,
              specialty: specialty,
              recipient_type: 'specialty',
              created_at: now
            });

          if (recipientError) {
            console.error("Error adding recipient:", recipientError);
          }
        }
      } 
      else if (values.recipientType === 'specific' && selectedMembers.length > 0) {
        // Add document for specific members
        for (const member of selectedMembers) {
          const { error: recipientError } = await supabase
            .from('document_recipients')
            .insert({
              document_id: documentData.id,
              recipient_id: member.id,
              recipient_type: 'specific',
              created_at: now
            });

          if (recipientError) {
            console.error("Error adding specific recipient:", recipientError);
          }
        }
      }
    }
    
    return documentData;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
