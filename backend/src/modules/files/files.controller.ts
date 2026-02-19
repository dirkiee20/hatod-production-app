import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@ApiTags('files')
@Controller('files')
export class FilesController {

  @Post('upload')
  @ApiOperation({ summary: 'Upload an image file (stored on Cloudinary)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Upload buffer to Cloudinary
      const url = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'hatod',
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result) return reject(error || new Error('Upload failed'));
            resolve(result.secure_url);
          },
        );
        const readable = Readable.from(file.buffer);
        readable.pipe(uploadStream);
      });

      return { url };
    } catch (err) {
      console.error('[Files] Cloudinary upload error:', err);
      throw new BadRequestException('Image upload failed. Please try again.');
    }
  }
}
