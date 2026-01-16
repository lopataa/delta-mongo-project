import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { UploadsService } from './uploads.service';

type PresignRequest = {
  files: { filename: string; contentType?: string }[];
};

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  @UseGuards(AdminGuard)
  async presign(@Body() body: PresignRequest) {
    const files = body?.files ?? [];
    const uploads = await Promise.all(
      files.map((file) =>
        this.uploadsService.createPresignedUpload(
          file.filename,
          file.contentType,
        ),
      ),
    );

    return { uploads };
  }
}
