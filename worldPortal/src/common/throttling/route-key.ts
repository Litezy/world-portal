import { RequestMethod, Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

/**
 * The keys the rate-limit map uses for a handler, such as `POST /otp/send`:
 * the HTTP method and the path as the controller declares it, without the
 * global `api` prefix. Read from the metadata Nest's own `@Controller` and
 * `@Post` decorators write, so no controller needs a decorator of ours.
 * A path given as an array yields one key per path.
 */
export function routeKeysFor(controller: object, handler: object): string[] {
  const method = Reflect.getMetadata(METHOD_METADATA, handler) as
    RequestMethod | undefined;
  if (method === undefined) return [];

  const verb = RequestMethod[method];
  const bases = asPaths(Reflect.getMetadata(PATH_METADATA, controller));
  const paths = asPaths(Reflect.getMetadata(PATH_METADATA, handler));
  return bases.flatMap((base) =>
    paths.map((path) => `${verb} ${joinPath(base, path)}`),
  );
}

/** Every route key a controller class declares. */
export function routeKeysOfController(controller: Type): string[] {
  const prototype = controller.prototype as Record<string, unknown>;
  return Object.getOwnPropertyNames(prototype)
    .filter((name) => name !== 'constructor')
    .map((name) => prototype[name])
    .filter((member): member is object => typeof member === 'function')
    .flatMap((handler) => routeKeysFor(controller, handler));
}

function asPaths(value: unknown): string[] {
  const paths = (Array.isArray(value) ? value : [value]).filter(
    (path): path is string => typeof path === 'string',
  );
  return paths.length ? paths : ['/'];
}

function joinPath(...parts: string[]): string {
  return `/${parts
    .flatMap((part) => part.split('/'))
    .filter(Boolean)
    .join('/')}`;
}
