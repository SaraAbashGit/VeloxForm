import { createServiceClient } from '@/lib/supabase/admin';

export async function uploadSignature(dataUrl: string, submissionId: string, fieldId: string): Promise<string> {
  const base64 = dataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  const supabase = createServiceClient();
  const fileName = `${submissionId}/${fieldId}.png`;

  const { error } = await supabase.storage
    .from('signatures')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('signatures').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadFile(fileJson: string, submissionId: string, fieldId: string): Promise<string> {
  const parsed = JSON.parse(fileJson) as { name: string; data: string; type: string };
  const base64 = parsed.data.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  const supabase = createServiceClient();
  const ext = parsed.name.split('.').pop() ?? 'bin';
  const fileName = `${submissionId}/${fieldId}.${ext}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(fileName, buffer, { contentType: parsed.type, upsert: true });

  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return data.publicUrl;
}
