// File Upload API for Certification Documents
import { NextResponse } from 'next/server'

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: PDF, JPG, PNG, WEBP' },
        { status: 400 }
      )
    }

    // Convert file to base64 (temporary solution)
    // In production, you should use cloud storage (Vercel Blob, Cloudinary, S3, etc.)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `cert_${timestamp}_${randomString}.${fileExtension}`

    // In production, upload to cloud storage here
    // For now, return the data URL (not recommended for production)
    console.log(`File uploaded: ${uniqueFilename}, Size: ${file.size} bytes, Type: ${file.type}`)

    return NextResponse.json({
      success: true,
      fileUrl: dataUrl, // In production, replace with cloud storage URL
      filename: uniqueFilename,
      fileSize: file.size,
      fileType: file.type,
      message: 'File uploaded successfully',
      // Note: Base64 data URLs are included for temporary storage only
      // Recommend upgrading to proper cloud storage for production
      warning: 'Using base64 encoding. Upgrade to cloud storage for production.'
    })
  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
}

// Optional: DELETE endpoint for removing uploaded files
export async function DELETE(request: Request) {
  try {
    const { fileUrl } = await request.json()

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      )
    }

    // In production with cloud storage, delete the file here
    // For base64 data URLs, there's nothing to delete

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error: any) {
    console.error('File deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve file metadata (useful for checking if file exists)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')

  if (!filename) {
    return NextResponse.json(
      { error: 'Filename is required' },
      { status: 400 }
    )
  }

  // In production with cloud storage, check if file exists and return metadata
  // For now, return a placeholder response

  return NextResponse.json({
    exists: false,
    message: 'File metadata retrieval not implemented for base64 storage'
  })
}
