import { landingIllSvg } from '@/content/landing-ill-content';

/**
 * Wrapper uses display:contents so the inline <svg class="ill"> is laid out as a
 * direct child of `.lp .dk` (same as v7). Otherwise width:min(100%,640px) resolves
 * against a shrink-wrapped div and the art renders tiny.
 */
export function LandingIllustration() {
  return (
    <div
      className="ill-host"
      dangerouslySetInnerHTML={{ __html: landingIllSvg }}
    />
  );
}
