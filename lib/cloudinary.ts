// NOTE: This module is currently unused in the application.
// It's available for future profile image upload features.
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(
  file: string, // base64 or URL
  folder: string = 'newshive'
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  })
  return { url: result.secure_url, publicId: result.public_id }
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId)
}

export default cloudinary
