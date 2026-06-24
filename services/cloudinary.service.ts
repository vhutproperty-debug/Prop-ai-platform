import { v2 as cloudinary } from "cloudinary";
import { isCloudinaryConfigured } from "@/config/env";

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const cloudinaryService = {
  isConfigured: isCloudinaryConfigured,

  async uploadImage(file: string, folder = "propai") {
    if (!isCloudinaryConfigured) {
      throw new Error("Cloudinary is not configured");
    }

    const result = await cloudinary.uploader.upload(file, { folder });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  },

  async deleteImage(publicId: string) {
    if (!isCloudinaryConfigured) {
      throw new Error("Cloudinary is not configured");
    }
    return cloudinary.uploader.destroy(publicId);
  },
};

export { cloudinary };
