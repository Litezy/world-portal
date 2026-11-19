import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  IsIn,
  ValidateIf,
} from 'class-validator';
import { AgencyListingStatus } from '@prisma/client';
import { IsHttpsUrl } from '../../common/validation/is-https-url';

/** The desk's verdicts on a listing, reached only by verifying the agency. */
export const DESK_ONLY_LISTING_STATUSES: AgencyListingStatus[] = [
  AgencyListingStatus.LIVE,
  AgencyListingStatus.IN_REVIEW,
  AgencyListingStatus.REJECTED,
];

/** What an agency may do with its own listing: draft it, submit it, pause it. */
export const AGENCY_LISTING_STATUSES: AgencyListingStatus[] = Object.values(
  AgencyListingStatus,
).filter((status) => !DESK_ONLY_LISTING_STATUSES.includes(status));

/** One service as the listing wizard sends it; the service fills any gaps. */
export interface AgencyOfferingInput {
  category?: string;
  title?: string;
  description?: string;
  price?: number | string | null;
  currency?: string;
  unit?: string;
  leadTimeHours?: number | string;
  capacity?: number | string;
}

export class UpdateAgencyListingDto {
  @ApiPropertyOptional({ description: 'Display name of the agency' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Legal registered company name' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Business registration / CAC number' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    description: 'ISO 2-character country code (e.g. NG, US)',
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Full country name' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Short summary headline' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'Detailed about section' })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ description: 'Logo image URL' })
  @IsOptional()
  @ValidateIf((_, value) => Boolean(value))
  @IsHttpsUrl()
  logoUrl?: string;

  /**
   * Ignored: the agency's email is how it signs in, and changing it needs a
   * verified flow that doesn't exist yet. Still accepted because the portal's
   * autosave sends the whole form, and refusing the field would refuse every
   * save.
   */
  @ApiPropertyOptional({
    deprecated: true,
    description:
      "Ignored: the agency's email is its sign-in identity and can't be changed here.",
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company website URL' })
  @IsOptional()
  @ValidateIf((_, value) => Boolean(value))
  @IsHttpsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Year founded' })
  @IsOptional()
  @IsNumber()
  yearFounded?: number;

  @ApiPropertyOptional({ description: 'Number of staff' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  staffCount?: number;

  @ApiPropertyOptional({
    description: 'Categories offered',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Cities operated in',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cities?: string[];

  @ApiPropertyOptional({
    description: 'Languages spoken',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({
    enum: AGENCY_LISTING_STATUSES,
    description:
      'Draft, submit or pause the listing. LIVE, IN_REVIEW and REJECTED are set only by the desk, through verification.',
  })
  @IsOptional()
  @IsIn(AGENCY_LISTING_STATUSES)
  listingStatus?: AgencyListingStatus;

  @ApiPropertyOptional({
    description: 'Service offerings',
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  offerings?: AgencyOfferingInput[];
}
