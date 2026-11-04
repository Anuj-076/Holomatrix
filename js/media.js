/* Shared image upload: shrinks the picture in the browser, then uploads it to Supabase Storage */
(function () {
  'use strict';
  async function shrink(file, max) {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    let blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.88));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise(r => c.toBlob(r, 'image/png'));
    return { blob, type: blob.type, ext: blob.type === 'image/webp' ? 'webp' : 'png' };
  }

  window.HoloMedia = {
    async upload(file, opt) {
      opt = opt || {};
      const bucket = opt.bucket || 'site-media', folder = opt.folder || 'site', max = opt.max || 1600;
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) throw new Error('Please choose a PNG, JPG, WEBP or GIF image.');
      if (file.size > 15 * 1024 * 1024) throw new Error('That image is too large (max 15 MB).');
      const out = await shrink(file, max);
      const path = folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + out.ext;
      const { error } = await sb.storage.from(bucket).upload(path, out.blob, { contentType: out.type, cacheControl: '31536000' });
      if (error) throw error;
      return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
  };
})();
