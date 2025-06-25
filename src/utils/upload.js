/**
 * Uploads a zip file to a presigned S3 URL.
 * This is an internal helper function used by deployApp.
 *
 * @param {string} filePath - Path to the zip file to upload
 * @param {string} presignedUrl - Presigned S3 URL for upload
 * @returns {Promise<void>}
 */
export async function uploadZipFile(filePath, presignedUrl) {
  // Import fetch here to avoid issues with ES modules
  const fetch = (await import('node-fetch')).default;
  const fs = await import('fs');

  const fileStream = fs.createReadStream(filePath);
  const stat = fs.statSync(filePath);

  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: fileStream,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': stat.size,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
}
