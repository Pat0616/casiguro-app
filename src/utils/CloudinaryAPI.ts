export async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "PeerReviewPostPreset");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/ddiuoddfs/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Image upload failed");
  }

  return data.secure_url;
}

