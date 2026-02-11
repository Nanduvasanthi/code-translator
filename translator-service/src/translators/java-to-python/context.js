import { TypeMapper } from '../../core/type-mapper.js';

export class TranslationContext {
  constructor() {
    this.variables = new Map();
    this.currentIndent = 0;
    this.inLoop = false;
    this.inConditional = false;
    this.warnings = [];
    this.parsers = new Map();
    this.generators = new Map();
  }

  reset() {
    this.variables.clear();
    this.currentIndent = 0;
    this.inLoop = false;
    this.inConditional = false;
    this.warnings = [];
  }

  addVariable(name, javaType, value = null) {
    this.variables.set(name, { javaType, value });
  }

  getVariableType(name) {
    const variable = this.variables.get(name);
    return variable ? variable.javaType : null;
  }

  getVariable(name) {
    return this.variables.get(name);
  }

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

  getIndent() {
    return '    '.repeat(this.currentIndent);
  }

  increaseIndent() {
    this.currentIndent++;
  }

  decreaseIndent() {
    if (this.currentIndent > 0) {
      this.currentIndent--;
    }
  }

  enterLoop() {
    this.inLoop = true;
  }

  exitLoop() {
    this.inLoop = false;
  }

  isInLoop() {
    return this.inLoop;
  }

  enterConditional() {
    this.inConditional = true;
  }

  exitConditional() {
    this.inConditional = false;
  }

  isInConditional() {
    return this.inConditional;
  }

  addWarning(warning) {
    this.warnings.push(warning);
  }

  getWarnings() {
    return this.warnings;
  }

  // Java to Python type mapping
  mapJavaToPython(javaType) {
    if (!javaType) return 'object';
    
    // Handle arrays
    if (javaType.endsWith('[]')) {
      return 'list';
    }
    
    // Handle primitive types
    const typeMap = {
      'byte': 'int',
      'short': 'int',
      'int': 'int',
      'long': 'int',
      'float': 'float',
      'double': 'float',
      'char': 'str',
      'boolean': 'bool',
      'String': 'str',
      'Object': 'object'
    };
    
    return typeMap[javaType] || 'object';
  }
}