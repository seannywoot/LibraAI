# Setting Up File Uploads

## Directory Structure

The application stores uploaded PDF files in the following location:
```
public/uploads/ebooks/
```

## Setup Instructions

### Development
The directory will be created automatically when the first PDF is uploaded. However, you can create it manually:

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Path "public/uploads/ebooks" -Force
```

**Linux/Mac:**
```bash
mkdir -p public/uploads/ebooks
```

### Production

#### Option 1: Local File Storage
1. Ensure the `public/uploads/ebooks` directory exists
2. Set appropriate permissions:
   - Linux/Mac: `chmod 755 public/uploads/ebooks`
   - Windows: Ensure the application has write permissions

#### Option 2: Cloud Storage (Recommended for Production)
For production deployments, consider using cloud storage:

**AWS S3:**
```javascript
// Install AWS SDK
npm install @aws-sdk/client-s3

// Update upload route to use S3
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

**Cloudinary:**
```javascript
// Install Cloudinary SDK
npm install cloudinary

// Configure Cloudinary
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

## File Size Limits

### Next.js Configuration
Add to `next.config.mjs`:
```javascript
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Adjust as needed
    },
  },
};
```

### Vercel Deployment
- Free tier: 4.5 MB limit
- Pro tier: 4.5 MB limit (use external storage for larger files)
- Enterprise: Custom limits

## Security Considerations

1. **File Type Validation**: Only PDF and image files are accepted
2. **File Size Limits**: Configure appropriate limits for your use case
3. **Virus Scanning**: Consider integrating ClamAV or similar for production
4. **Access Control**: Files are only accessible to the user who uploaded them
5. **Filename Sanitization**: Filenames are sanitized and timestamped

## Backup Strategy

### Local Backups
```powershell
# Windows PowerShell
Copy-Item -Path "public/uploads" -Destination "backups/uploads-$(Get-Date -Format 'yyyy-MM-dd')" -Recurse
```

### Cloud Backups
- Use AWS S3 versioning
- Enable Cloudinary backup
- Set up automated backup scripts

## Monitoring

Track storage usage:
```javascript
// Add to admin dashboard
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

async function getStorageStats() {
  const uploadsDir = join(process.cwd(), 'public/uploads/ebooks');
  const files = await readdir(uploadsDir);
  
  let totalSize = 0;
  for (const file of files) {
    const stats = await stat(join(uploadsDir, file));
    totalSize += stats.size;
  }
  
  return {
    fileCount: files.length,
    totalSize: totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
  };
}
```

## Troubleshooting

### Permission Denied Errors
- Ensure the application has write permissions to the uploads directory
- Check that the directory exists and is writable

### File Not Found After Upload
- Verify the file path is correct
- Check that the public directory is being served correctly
- Ensure the file wasn't deleted by cleanup scripts

### Large File Upload Failures
- Increase the body size limit in Next.js config
- Check server timeout settings
- Consider chunked uploads for very large files
