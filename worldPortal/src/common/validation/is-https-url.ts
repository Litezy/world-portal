import { IsUrl, ValidationOptions } from 'class-validator';

/**
 * `@IsUrl({ protocols: ['https'], require_protocol: true })`: an absolute
 * https link and nothing else.
 *
 * For every URL a caller hands us to store (document uploads, logos,
 * websites, photos). Desk staff open them and travellers are shown them, so
 * `http:` (readable and swappable in transit), `javascript:` / `data:` (run
 * in whoever opens them) and scheme-less links are all refused. Pass
 * `{ each: true }` for a list.
 */
export const HTTPS_URL_OPTIONS = {
  protocols: ['https'],
  require_protocol: true,
};

export function IsHttpsUrl(validationOptions?: ValidationOptions) {
  return IsUrl(HTTPS_URL_OPTIONS, {
    message: ({ property }) =>
      validationOptions?.each
        ? `each entry in ${property} must be an https:// link`
        : `${property} must be an https:// link`,
    ...validationOptions,
  });
}
