import {
  Injectable,
  Logger,
  BadGatewayException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportsResponseDto } from './dto/passport.dto';
import { DestinationsResponseDto } from './dto/destination.dto';
import { VisaCheckQueryDto, VisaCheckResponseDto } from './dto/visa-check.dto';
import { VisaMapQueryDto, VisaMapResponseDto } from './dto/visa-map.dto';

@Injectable()
export class VisaRequirementService {
  private readonly logger = new Logger(VisaRequirementService.name);
  private readonly host: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  private passportsCache: PassportsResponseDto | null = null;
  private cacheTimestamp = 0;

  private destinationsCache: DestinationsResponseDto | null = null;
  private destinationsCacheTimestamp = 0;

  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

  constructor(private readonly configService: ConfigService) {
    this.host = this.configService.get<string>(
      'RAPIDAPI_VISA_REQUIREMENT_HOST',
      'visa-requirement.p.rapidapi.com',
    );
    this.apiKey =
      this.configService.get<string>('RAPIDAPI_VISA_REQUIREMENT_KEY') || '';
    this.baseUrl = this.configService.get<string>(
      'RAPIDAPI_VISA_REQUIREMENT_BASE_URL',
      'https://visa-requirement.p.rapidapi.com',
    );

    if (!this.apiKey) {
      this.logger.warn(
        'RAPIDAPI_VISA_REQUIREMENT_KEY is not configured in environment settings.',
      );
    }

    this.logger.log(
      `VisaRequirementService initialized with host=${this.host}, baseUrl=${this.baseUrl}`,
    );
  }

  /**
   * Retrieves full list of supported passports from cache or RapidAPI endpoint.
   */
  async getPassports(): Promise<PassportsResponseDto> {
    const now = Date.now();
    if (this.passportsCache && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      this.logger.debug('Returning passports list from in-memory cache');
      return this.passportsCache;
    }

    this.logger.log('Fetching passports list from RapidAPI service');
    const url = `${this.baseUrl.replace(/\/$/, '')}/v2/passports`;

    const data = await this.executeFetch<PassportsResponseDto>(url, {
      method: 'GET',
    });

    if (data && Array.isArray(data.data)) {
      this.passportsCache = data;
      this.cacheTimestamp = now;
      this.logger.log(
        `Passports list fetched & cached successfully (${data.data.length} entries)`,
      );
    }

    return data;
  }

  /**
   * Retrieves full list of supported destinations from cache or RapidAPI endpoint.
   */
  async getDestinations(): Promise<DestinationsResponseDto> {
    const now = Date.now();
    if (
      this.destinationsCache &&
      now - this.destinationsCacheTimestamp < this.CACHE_TTL_MS
    ) {
      this.logger.debug('Returning destinations list from in-memory cache');
      return this.destinationsCache;
    }

    this.logger.log('Fetching destinations list from RapidAPI service');
    const url = `${this.baseUrl.replace(/\/$/, '')}/v2/destinations`;

    const data = await this.executeFetch<DestinationsResponseDto>(url, {
      method: 'GET',
    });

    if (data && Array.isArray(data.data)) {
      this.destinationsCache = data;
      this.destinationsCacheTimestamp = now;
      this.logger.log(
        `Destinations list fetched & cached successfully (${data.data.length} entries)`,
      );
    }

    return data;
  }

  /**
   * Checks visa requirement between passport and destination.
   */
  async checkVisa(query: VisaCheckQueryDto): Promise<VisaCheckResponseDto> {
    if (!query.passport || !query.destination) {
      throw new BadRequestException(
        'Both passport and destination are required',
      );
    }

    this.logger.log(
      `Checking visa policy for passport=${query.passport} to destination=${query.destination}`,
    );
    const url = `${this.baseUrl.replace(/\/$/, '')}/v2/visa/check`;

    const body = new URLSearchParams({
      passport: query.passport.toUpperCase(),
      destination: query.destination.toUpperCase(),
    }).toString();

    return this.executeFetch<VisaCheckResponseDto>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }

  /**
   * Retrieves global visa map breakdown for a specific passport.
   */
  async getVisaMap(query: VisaMapQueryDto): Promise<VisaMapResponseDto> {
    if (!query.passport) {
      throw new BadRequestException('Passport code is required');
    }

    this.logger.log(`Fetching visa map for passport=${query.passport}`);
    const url = `${this.baseUrl.replace(/\/$/, '')}/v2/visa/map`;

    const body = new URLSearchParams({
      passport: query.passport.toUpperCase(),
    }).toString();

    return this.executeFetch<VisaMapResponseDto>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }

  /**
   * Helper method executing HTTP fetch with RapidAPI authentication headers.
   */
  private async executeFetch<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': this.host,
          'x-rapidapi-key': this.apiKey,
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `RapidAPI request failed url=${url}, status=${response.status}, error=${errorText}`,
        );
        throw new BadGatewayException(
          `RapidAPI Visa Requirement service returned status ${response.status}`,
        );
      }

      const result = (await response.json()) as T;
      return result;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof BadGatewayException) {
        throw error;
      }
      const msg =
        error instanceof Error ? error.message : 'Unknown fetch error';
      this.logger.error(
        `Failed to connect to RapidAPI service at ${url}: ${msg}`,
      );
      throw new BadGatewayException(
        `Failed to communicate with RapidAPI Visa Requirement service: ${msg}`,
      );
    }
  }
}
