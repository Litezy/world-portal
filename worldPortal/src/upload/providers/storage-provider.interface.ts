export interface StorageUploadResult {
  url: string;
  key: string;
}

export interface IStorageProvider {
  uploadFile(file: Express.Multer.File): Promise<StorageUploadResult>;
}
