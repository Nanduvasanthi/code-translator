export class TranslationContext {
  constructor() {
    this.symbols = new Map();
    this.warnings = [];
    this.currentFunction = null;
    this.currentClass = null;
    this.parsers = {};
    this.generators = {};
    this._id = Math.random().toString(36).substr(2, 9); // Add unique ID for tracking
    console.log(`🆔 [Context] Created new context with ID: ${this._id}`);
  }

  // Add this method
  getParser(name) {
    return this.parsers[name];
  }

  // Add this method too (for completeness)
  getGenerator(name) {
    return this.generators[name];
  }

  // Keep all existing methods...
  addSymbol(name, info) {
    console.log(`📝 [Context ${this._id}] Adding symbol: ${name} =`, info);
    console.log(`   Context ID: ${this._id}`);
    console.log(`   Symbols count before: ${this.symbols.size}`);
    console.log(`   Call stack:`, new Error().stack.split('\n').slice(2, 5).join('\n'));
    this.symbols.set(name, info);
    console.log(`   Symbols count after: ${this.symbols.size}`);
    console.log(`   All symbols now:`, Array.from(this.symbols.keys()));
  }

  getSymbol(name) {
    const hasSymbol = this.symbols.has(name);
    const result = this.symbols.get(name);
    console.log(`🔍 [Context ${this._id}] Looking up symbol "${name}":`, result);
    console.log(`   Context ID: ${this._id}`);
    console.log(`   Has symbol "${name}": ${hasSymbol}`);
    console.log(`   All symbols in this context:`, Array.from(this.symbols.keys()));
    console.log(`   Call stack:`, new Error().stack.split('\n').slice(2, 5).join('\n'));
    return result;
  }

  hasSymbol(name) {
    const result = this.symbols.has(name);
    console.log(`❓ [Context ${this._id}] Checking if has symbol "${name}": ${result}`);
    return result;
  }

  addVariable(name, type, value = null) {
    this.addSymbol(name, { type, value });
  }

  registerParser(name, parser) {
    console.log(`📋 [Context ${this._id}] Registering parser: ${name}`);
    this.parsers[name] = parser;
  }

  registerGenerator(name, generator) {
    console.log(`📋 [Context ${this._id}] Registering generator: ${name}`);
    this.generators[name] = generator;
  }

  addWarning(warning) {
    this.warnings.push(warning);
    console.warn(`⚠️ ${warning}`);
  }

  getWarnings() {
    return this.warnings;
  }

  setCurrentFunction(funcName) {
    this.currentFunction = funcName;
  }

  getCurrentFunction() {
    return this.currentFunction;
  }

  setCurrentClass(className) {
    this.currentClass = className;
  }

  getCurrentClass() {
    return this.currentClass;
  }

  mapJavaTypeToC(javaType) {
    const typeMap = {
      'byte': 'char',
      'short': 'short',
      'int': 'int',
      'long': 'long',
      'float': 'float',
      'double': 'double',
      'char': 'char',
      'boolean': 'int',
      'String': 'char*',
      'void': 'void'
    };
    
    if (javaType.endsWith('[]')) {
      const baseType = javaType.slice(0, -2);
      const cBaseType = typeMap[baseType] || 'int';
      return `${cBaseType}*`;
    }
    
    return typeMap[javaType] || 'int';
  }

  escapeCString(str) {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t');
  }

  // Helper method to clone context for nested scopes
  createNestedContext() {
    console.log(`🌀 [Context ${this._id}] Creating nested context`);
    const nested = new TranslationContext();
    // Copy symbols from parent (optional - depends on your scoping rules)
    // nested.symbols = new Map(this.symbols);
    
    // Copy other properties
    nested.warnings = [...this.warnings];
    nested.currentFunction = this.currentFunction;
    nested.currentClass = this.currentClass;
    nested.parsers = { ...this.parsers };
    nested.generators = { ...this.generators };
    
    return nested;
  }
}