export type UploadedAsset = {
  publicId: string;
  secureUrl: string;
  bytes: number;
  resourceType: "image" | "video" | "raw";
  originalFilename: string;
  mimeType: string;
  extension: string;
  relativePath: string;
};

export type CompressRequestBody = {
  assets: UploadedAsset[];
  compressionPercentage: number;
  userId?: string;
};

export type CompressionResult = {
  originalTotalBytes: number;
  compressedTotalBytes: number;
  percentSaved: number;
  signedDownloadUrl: string;
  zipPublicId: string;
};
