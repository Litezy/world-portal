'use client';
// VENDORED from worldstreet/design-system by scripts/vendor.mjs. Don't edit: change the design system and re-run it.

import { type AnchorHTMLAttributes, type HTMLAttributes, type PointerEvent } from 'react';
import { cx } from '../lib/cx';

export type GlassVariant = 'regular' | 'clear' | 'tinted' | 'thin';
export type GlassShape = 'card' | 'panel' | 'pill' | 'circle';

export type GlassProps = HTMLAttributes<HTMLElement> & {
  /** regular: the default material · clear: over photos and video · tinted: gold glass for the active or primary thing · thin: a lighter veil. */
  variant?: GlassVariant;
  /** card 20px (default) · panel 30px · pill · circle. */
  shape?: GlassShape;
  /** Hover sheen, a press that gives like a lens, and (with a mouse) the light follows the pointer. */
  interactive?: boolean;
  /** Force dark or light glass regardless of the theme, for glass over a light hue field on a dark page and the like. */
  tone?: 'auto' | 'dark' | 'light';
  /** Renders an <a> (implies interactive). */
  href?: string;
  as?: 'div' | 'section' | 'nav' | 'header' | 'aside' | 'article' | 'li' | 'span';
};

/** Moves the sheen to the pointer, as a percentage of the box. Mouse only: touch keeps the resting light. */
function follow(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--lg-x', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
  el.style.setProperty('--lg-y', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
}
function rest(e: PointerEvent<HTMLElement>) {
  e.currentTarget.style.removeProperty('--lg-x');
  e.currentTarget.style.removeProperty('--lg-y');
}

/** Liquid glass (.cx-liquid). Put it over something: a photo, video, a hue field, an aurora. */
export function Glass({
  variant = 'regular',
  shape = 'card',
  interactive,
  tone = 'auto',
  href,
  as = 'div',
  className,
  onPointerMove,
  onPointerLeave,
  children,
  ...props
}: GlassProps) {
  const live = interactive || !!href;
  const cls = cx(
    'cx-liquid',
    variant !== 'regular' && `cx-liquid--${variant}`,
    shape !== 'card' && `cx-liquid--${shape}`,
    live && 'cx-liquid--interactive',
    tone !== 'auto' && `cx-glass-${tone}`,
    className,
  );
  const handlers = live
    ? {
        onPointerMove: (e: PointerEvent<HTMLElement>) => { follow(e); onPointerMove?.(e); },
        onPointerLeave: (e: PointerEvent<HTMLElement>) => { rest(e); onPointerLeave?.(e); },
      }
    : { onPointerMove, onPointerLeave };
  if (href) {
    return (
      <a {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)} {...handlers} href={href} className={cls}>
        {children}
      </a>
    );
  }
  const Tag = as;
  return (
    <Tag {...props} {...handlers} className={cls}>
      {children}
    </Tag>
  );
}

/** A glass capsule holding a row of controls. Put quiet buttons inside: the dock is the glass. */
export function GlassDock({ className, tone = 'auto', variant = 'regular', ...props }: HTMLAttributes<HTMLDivElement> & Pick<GlassProps, 'tone' | 'variant'>) {
  return (
    <div
      role="toolbar"
      {...props}
      className={cx('cx-liquid', 'cx-liquid-dock', variant !== 'regular' && `cx-liquid--${variant}`, tone !== 'auto' && `cx-glass-${tone}`, className)}
    />
  );
}
