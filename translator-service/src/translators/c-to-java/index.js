import { CToJavaTranslator } from './translator.js';

export { CToJavaTranslator };

// Main export function
export function translateCToJava(ast) {
  const translator = new CToJavaTranslator();
  return translator.translate(ast);
}

// For direct code translation (requires tree-sitter setup)
export function translateCCode(cCode) {
  const translator = new CToJavaTranslator();
  return translator.translateCode(cCode);
}

// Utility functions
export function createTranslator() {
  return new CToJavaTranslator();
}

// Version info
export const VERSION = '1.0.0';
export const SUPPORTED_C_STANDARD = 'C99';
export const TARGET_JAVA_VERSION = 'Java 8+';

// Export context and visitor for advanced usage
export { CToJavaContext } from './context.js';
export { CToJavaVisitor } from './visitor.js';