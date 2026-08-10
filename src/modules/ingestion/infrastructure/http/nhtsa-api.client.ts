import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class NhtsaApiClient {
  private readonly logger = new Logger(NhtsaApiClient.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('NHTSA_BASE_URL')!;
    this.timeoutMs = this.configService.get<number>('NHTSA_REQUEST_TIMEOUT_MS')!;
  }

  async getAllMakesXml(): Promise<string> {
    return this.fetchXml('/getallmakes?format=XML');
  }

  async getVehicleTypesForMakeXml(makeId: string): Promise<string> {
    return this.fetchXml(`/GetVehicleTypesForMakeId/${makeId}?format=XML`);
  }

  private async fetchXml(path: string): Promise<string> {
    const url = `${this.baseUrl}${path}`;
    try {
      const response = await firstValueFrom(
        this.httpService.get<string>(url, {
          timeout: this.timeoutMs,
          responseType: 'text',
        }),
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Failed to fetch NHTSA data from ${url}: ${axiosError.message}`,
        axiosError.stack,
      );
      throw new NhtsaApiError(`Request to NHTSA API failed: ${url}`, axiosError);
    }
  }
}

export class NhtsaApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'NhtsaApiError';
  }
}
