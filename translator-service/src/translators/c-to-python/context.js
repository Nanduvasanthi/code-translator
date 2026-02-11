export class TranslationContext {
  constructor() {
    this.parsers = {};
    this.generators = {};
    this.warnings = [];
    this.variables = new Map();
    this.functions = new Map();
    this.currentScope = 'global';
  }

  registerParser(name, parser) {
    this.parsers[name] = parser;
  }

  registerGenerator(name, generator) {
    this.generators[name] = generator;
  }

  getParser(name) {
    return this.parsers[name];
  }

  getGenerator(name) {
    return this.generators[name];
  }

  addWarning(warning) {
    this.warnings.push(warning);
    console.warn(`[Warning]: ${warning}`);
  }

  getWarnings() {
    return this.warnings;
  }

  addVariable(name, type, scope = this.currentScope) {
    this.variables.set(`${scope}.${name}`, { name, type, scope });
  }

  getVariable(name, scope = this.currentScope) {
    return this.variables.get(`${scope}.${name}`);
  }

  addFunction(name, returnType, parameters = []) {
    this.functions.set(name, { name, returnType, parameters });
  }

  getFunction(name) {
    return this.functions.get(name);
  }

  enterScope(scopeName) {
    const oldScope = this.currentScope;
    this.currentScope = scopeName;
    return oldScope;
  }

  exitScope() {
    this.currentScope = 'global';
  }
}