import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly client: Client;
  private readonly presignClient: Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const endPoint = process.env.MINIO_ENDPOINT ?? 'localhost';
    const port = Number(process.env.MINIO_PORT ?? 9000);
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const accessKey = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY ?? 'minioadmin';
    const presignEndPoint = process.env.MINIO_PRESIGN_ENDPOINT ?? endPoint;
    const presignPort = Number(process.env.MINIO_PRESIGN_PORT ?? port);
    const presignUseSSL = process.env.MINIO_PRESIGN_USE_SSL === 'true' || useSSL;
    const region = process.env.MINIO_REGION ?? 'us-east-1';
    const presignRegion = process.env.MINIO_PRESIGN_REGION ?? region;

    this.client = new Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
      region,
    });
    this.presignClient = new Client({
      endPoint: presignEndPoint,
      port: presignPort,
      useSSL: presignUseSSL,
      accessKey,
      secretKey,
      region: presignRegion,
    });
    this.bucket = process.env.MINIO_BUCKET ?? 'schoolshop';
    this.publicUrl =
      process.env.MINIO_PUBLIC_URL ?? `http://${endPoint}:${port}`;
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async createPresignedUpload(filename: string, contentType?: string) {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectName = `${randomUUID()}-${safeName}`;
    const uploadUrl = await this.presignClient.presignedPutObject(
      this.bucket,
      objectName,
      60 * 5,
    );

    if (contentType) {
      return {
        objectName,
        uploadUrl,
        fileUrl: `${this.publicUrl}/${this.bucket}/${objectName}`,
        contentType,
      };
    }

    return {
      objectName,
      uploadUrl,
      fileUrl: `${this.publicUrl}/${this.bucket}/${objectName}`,
    };
  }
}
