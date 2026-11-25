export const PRODUCTION_POLICY: string
export function sha256(text: string): string
export function portablePolicy(inlineScripts: readonly string[]): string
export function applySecurityMeta(html: string, policy?: string): string
