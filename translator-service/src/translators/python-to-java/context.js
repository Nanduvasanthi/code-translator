export class TranslationContext {
  constructor() {
    this.variables = new Map();
    this.imports = new Set();
    this.indentLevel = 0;
    this.lastProcessedLine = -1;
    this.parsers = new Map();      // NEW: Store parsers
    this.generators = new Map();   // NEW: Store generators
  }

  addVariable(name, type) {
    this.variables.set(name, { type });
  }

  getVariableType(name) {
    return this.variables.get(name)?.type || 'Object';
  }

  // NEW METHODS FOR PARSER/GENERATOR REGISTRY
  registerParser(name, parser) {
    this.parsers.set(name, parser);
  }

  getParser(name) {
    return this.parsers.get(name);
  }

  registerGenerator(name, generator) {
    this.generators.set(name, generator);
  }

  getGenerator(name) {
    return this.generators.get(name);
  }

  // Existing methods
  addImport(importStatement) {
    this.imports.add(importStatement);
  }

  getImports() {
    return Array.from(this.imports);
  }

  indent() {
    this.indentLevel++;
  }

  dedent() {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }

  getIndent() {
    return '    '.repeat(this.indentLevel);
  }

  updateLastLine(lineNumber) {
    this.lastProcessedLine = lineNumber;
  }

  getLastLine() {
    return this.lastProcessedLine;
  }
}