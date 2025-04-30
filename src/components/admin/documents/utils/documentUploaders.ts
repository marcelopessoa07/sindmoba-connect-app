import { supabase } from "@/integrations/supabase/client";
import { FormValues } from "../DocumentForm";
import { SpecialtyType } from "../recipients/SpecialtySelector";
import { Member } from "../recipients/RecipientSelector";

/**
 * Uploads a document with metadata and assigns recipients
 */
export const uploadDocument = async (
  values: FormValues, 
  file: File | null,
  selectedSpecialties: SpecialtyType[],
  selectedMembers: Member[]
) => {
  if (!file) {
    throw new Error("Nenhum arquivo selecionado");
  }

  // Upload file to storage
  const fileName = `${Date.now()}_${file.name}`;
  const { data: fileData, error: fileError } = await supabase
    .storage
    .from('documents')
    .upload(fileName, file);

  if (fileError) {
    throw fileError;
  }

  // Create document record
  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert({
      title: values.title,
      description: values.description || null,
      document_type: values.documentType,
      file_path: fileName,
      notify_target: values.notifyTarget,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select('id')
    .single();

  if (docError) {
    // Cleanup uploaded file if document creation fails
    await supabase.storage.from('documents').remove([fileName]);
    throw docError;
  }

  // Process specialty recipients if any
  if (selectedSpecialties.length > 0) {
    const specialtyRecipients = selectedSpecialties.map((specialty) => ({
      document_id: docData.id,
      specialty_id: specialty.id,
    }));

    const { error: specialtyError } = await supabase
      .from('document_specialty_recipients')
      .insert(specialtyRecipients);

    if (specialtyError) {
      throw specialtyError;
    }
  }

  // Process individual member recipients if any
  if (selectedMembers.length > 0) {
    const memberRecipients = selectedMembers.map((member) => ({
      document_id: docData.id,
      user_id: member.id,
    }));

    const { error: memberError } = await supabase
      .from('document_user_recipients')
      .insert(memberRecipients);

    if (memberError) {
      throw memberError;
    }
  }

  return docData.id;
};
