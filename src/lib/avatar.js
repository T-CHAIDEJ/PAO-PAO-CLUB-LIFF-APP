// Resizes/compresses an image file client-side before upload, since phone
// photos can be several MB and we only need a small square avatar.
export function compressImage(file, { maxSize = 480, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Image compression failed'));
      }, 'image/jpeg', quality);
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// Uploads a child's profile photo to the `avatars` storage bucket and
// updates 003_children.avatar_url. childId is the children.child_id
// business key (same one 004_growth.child_id references), not the row PK.
export async function uploadChildAvatar(supabase, childId, file) {
  const blob = await compressImage(file);
  const path = `children/${childId}-${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
  });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: dbErr } = await supabase.from('003_children').update({ avatar_url: publicUrl }).eq('child_id', childId);
  if (dbErr) throw dbErr;

  return publicUrl;
}
