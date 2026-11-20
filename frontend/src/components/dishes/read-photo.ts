export async function readPhoto(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Elegí una foto.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("La foto es muy pesada. Probá con una de menos de 8 MB.");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No pudimos leer la foto."));
    reader.readAsDataURL(file);
  });
  return resize(dataUrl);
}

function resize(dataUrl: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const max = 960;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => reject(new Error("No pudimos leer la foto."));
    image.src = dataUrl;
  });
}
