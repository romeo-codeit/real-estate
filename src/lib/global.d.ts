// Global type declarations
declare global {
  var csrfTokens: Map<string, { token: string; expires: number }> | undefined;
}

export {};