import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVisaDocumentationDto } from '../../visa-documentation/dto/create-visa-documentation.dto';
import { CreatePassportApplicationDto } from '../../passport-application/dto/create-passport-application.dto';
import { UploadAgencyDocumentDto } from '../../agency/dto/upload-agency-document.dto';
import { UpdateAgencyListingDto } from '../../agency/dto/update-agency-listing.dto';
import { CreateAgencyDto } from '../../agency/dto/create-agency.dto';
import {
  AddAgencyStaffDto,
  UpdateAgencyStaffDto,
} from '../../agency/dto/add-agency-staff.dto';

/**
 * Every URL an applicant or an agency hands us is stored and later opened by
 * desk staff (documents) or shown to travellers (logos, websites, photos). An
 * `http:` link can be read or swapped in transit, and `javascript:` or
 * `data:` links run in whoever opens them, so only https is accepted.
 */
type DtoClass = new () => object;

const visaBase = {
  firstName: 'Sample',
  lastName: 'Person',
  email: 'applicant@example.com',
  targetCountry: 'Canada',
};
const passportBase = {
  passportCategory: 'FRESH',
  surname: 'Person',
  firstName: 'Sample',
  sex: 'MALE',
  ninNumber: '12345678901',
  email: 'applicant@example.com',
};
const agencyBase = {
  name: 'Sample Agency',
  legalName: 'Sample Agency Ltd',
  countryCode: 'NG',
  country: 'Nigeria',
  cities: ['Lagos'],
  categories: ['security'],
  summary: 'Summary',
  about: 'About',
  email: 'agency@example.com',
  phone: '+2340000000000',
  yearFounded: 2020,
  staffCount: 5,
  languages: ['English'],
};
const staffBase = {
  name: 'Sample Person',
  role: 'Guard',
  category: 'security',
  phone: '+2340000000000',
  languages: ['English'],
  experienceYears: 3,
};
const documentBase = { kind: 'TAX_CERTIFICATE', fileName: 'tax.pdf' };

/** [dto name, field, dto class, a valid body without the field] */
type Row = [string, string, DtoClass, object];

const single: Row[] = [
  ...[
    'passportDataPageUrl',
    'passportPhotoWhiteBgUrl',
    'proofOfFunds6MonthsUrl',
    'businessRegistrationCertUrl',
    'taxCertificateUrl',
    'marriageCertificateUrl',
  ].map(
    (field) =>
      [
        'CreateVisaDocumentationDto',
        field,
        CreateVisaDocumentationDto,
        visaBase,
      ] as Row,
  ),
  ...['birthCertificateUrl', 'ninDocumentUrl', 'passportPhotoUrl'].map(
    (field) =>
      [
        'CreatePassportApplicationDto',
        field,
        CreatePassportApplicationDto,
        passportBase,
      ] as Row,
  ),
  ['UploadAgencyDocumentDto', 'fileUrl', UploadAgencyDocumentDto, documentBase],
  ['UpdateAgencyListingDto', 'logoUrl', UpdateAgencyListingDto, {}],
  ['UpdateAgencyListingDto', 'website', UpdateAgencyListingDto, {}],
  ['CreateAgencyDto', 'logoUrl', CreateAgencyDto, agencyBase],
  ['CreateAgencyDto', 'website', CreateAgencyDto, agencyBase],
  ['AddAgencyStaffDto', 'photoUrl', AddAgencyStaffDto, staffBase],
  ['UpdateAgencyStaffDto', 'photoUrl', UpdateAgencyStaffDto, {}],
];

const arrays: Row[] = [
  'childrenBirthCertUrls',
  'landedPropertyDocUrls',
  'previousVisasScanUrls',
  'supportingDocUrls',
].map((field) => [
  'CreateVisaDocumentationDto',
  field,
  CreateVisaDocumentationDto,
  visaBase,
]);

const errorsFor = async (dto: DtoClass, body: object) =>
  (
    await validate(plainToInstance(dto, body), {
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  ).map((error) => error.property);

const GOOD =
  'https://world-portal-documents.s3.us-east-1.amazonaws.com/documents/a.pdf';
const BAD = [
  'http://world-portal-documents.s3.us-east-1.amazonaws.com/documents/a.pdf',
  'javascript:alert(document.cookie)',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  'ftp://files.example.com/a.pdf',
  'world-portal-documents.s3.amazonaws.com/documents/a.pdf',
];

describe('applicant- and agency-supplied URLs', () => {
  describe.each(single)('%s.%s', (_name, field, dto, base) => {
    it('accepts an https URL', async () => {
      expect(await errorsFor(dto, { ...base, [field]: GOOD })).toEqual([]);
    });

    it.each(BAD)('refuses %s', async (url) => {
      expect(await errorsFor(dto, { ...base, [field]: url })).toContain(field);
    });
  });

  describe.each(arrays)('%s.%s (each entry)', (_name, field, dto, base) => {
    it('accepts https URLs', async () => {
      expect(await errorsFor(dto, { ...base, [field]: [GOOD, GOOD] })).toEqual(
        [],
      );
    });

    it.each(BAD)('refuses a list holding %s', async (url) => {
      expect(await errorsFor(dto, { ...base, [field]: [GOOD, url] })).toContain(
        field,
      );
    });
  });
});
