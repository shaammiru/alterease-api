import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;
const blobService = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobService.getContainerClient(containerName);

const uploadFile = async (
  file: Buffer,
  fileName: string,
  folderName: string
) => {
  const blobName = `${folderName}/${new Date().getTime()}-${fileName}`;

  await containerClient.createIfNotExists();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(file);

  return blockBlobClient.url;
};

export default { uploadFile };
