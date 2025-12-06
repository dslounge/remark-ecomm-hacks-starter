import type { ImagePrompt } from '@summit-gear/shared';

/**
 * Renders an ImagePrompt JSON object to a text string suitable for AI image generation.
 */
export function renderPromptText(prompt: ImagePrompt): string {
  const parts: string[] = [];

  // Style and quality first (sets the overall tone)
  parts.push(prompt.style.quality);

  // Subject description
  let subject = `A ${prompt.subject.color} ${prompt.subject.product}`;
  if (prompt.subject.material) {
    subject += ` made of ${prompt.subject.material}`;
  }
  parts.push(subject);

  // Presentation variant
  parts.push(prompt.subject.variant);

  // Visible details
  if (prompt.subject.details?.length) {
    parts.push(`with ${prompt.subject.details.join(', ')}`);
  }

  // Camera setup
  parts.push(`${prompt.camera.angle} angle, ${prompt.camera.distance} shot`);
  parts.push(prompt.camera.focus);

  // Lighting
  parts.push(`${prompt.lighting.setup} lighting with ${prompt.lighting.shadows} shadows`);

  return parts.join('. ') + '.';
}
