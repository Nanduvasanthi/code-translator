export class TranslationContext {
  constructor() {
    this.parsers = {};
    this.generators = {};
    this.variables = new Map();
    this.currentScope = 'global';
    this.needsStdbool = false;
  }

  registerParser(name, parser) {
    this.parsers[name] = parser;
  }

  registerGenerator(name, generator) {
    this.generators[name] = generator;
  }

  // ADD THESE 2 METHODS:
  getParser(name) {
    return this.parsers[name];
  }

  getGenerator(name) {
    return this.generators[name];
  }

  addVariable(name, type) {
    this.variables.set(name, type);
  }

  getVariableType(name) {
    return this.variables.get(name);
  }

  hasVariable(name) {
    return this.variables.has(name);
  }

  setScope(scope) {
    this.currentScope = scope;
  }

  getScope() {
    return this.currentScope;
  }
}