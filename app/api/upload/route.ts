import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    // Verify user is authenticated and authorized (admin, lecturer)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRole = (session.user as any).role;
    const isPdfUpload = request.headers.get('X-Resource-Type') === 'pdf';
    
    // Only admin can upload any type, lecturers can only upload PDFs
    if (userRole !== 'Admin' && (!isPdfUpload || userRole !== 'Lecturer')) {
      return NextResponse.json(
        { error: 'You do not have permission to upload this type of file' },
        { status: 403 }
      );
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert buffer to base64 string
    const base64String = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64String}`;

    // Determine upload parameters based on file type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: 'Only images and PDF files are supported' },
        { status: 400 }
      );
    }
    
    // Upload to Cloudinary with appropriate parameters
    const result = await new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: isImage ? 'book-covers' : 'academic-resources',
        resource_type: isImage ? 'image' : 'auto',
      };
      
      // Add transformation settings for images
      if (isImage) {
        uploadOptions.transformation = [
          { width: 500, height: 750, crop: 'limit' },
          { quality: 'auto:good' }
        ];
      }
      
      // For PDFs, add PDF-specific options
      if (isPdf) {
        uploadOptions.format = 'pdf';
        uploadOptions.use_filename = true;
        uploadOptions.unique_filename = true;
      }
      
      cloudinary.uploader.upload(
        dataURI,
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    // Return the Cloudinary URL to the client
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}