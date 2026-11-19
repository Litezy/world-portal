export interface StorageUploadResult {
  url: string;
  key: string;
}

/**
 * One object to store. `key` and `contentType` are decided by UploadService
 * (a generated name, the type read from the bytes); providers must use them
 * as given and never derive either from the uploaded file's name or MIME claim.
 */
export interface StorageObject {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface IStorageProvider {
  uploadFile(object: StorageObject): Promise<StorageUploadResult>;
}
