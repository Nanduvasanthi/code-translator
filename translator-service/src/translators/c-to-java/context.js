// translators/c-to-java/context.js - FIXED VERSION
export class CToJavaContext {
  constructor() {
    this.variables = new Map();
    this.functions = new Map();
    this.currentFunction = null;
    this.parsers = {}; // CHANGED: Now an object instead of Map
  }

  addVariable(name, type) {
    this.variables.set(name, {
      name,
      type,
      isArray: type.endsWith('[]'),
      isPointer: type.includes('*')
    });
  }

  getVariableType(name) {
    const varInfo = this.variables.get(name);
    return varInfo ? varInfo.type : null;
  }

  addFunction(name, returnType, parameters = []) {
    this.functions.set(name, {
      name,
      returnType,
      parameters,
      localVariables: new Map()
    });
  }

  enterFunction(name, returnType, parameters = []) {
    this.currentFunction = {
      name,
      returnType,
      parameters,
      localVariables: new Map()
    };
    this.addFunction(name, returnType, parameters);
  }

  exitFunction() {
    if (this.currentFunction) {
      // Save local variables to function map
      const funcInfo = this.functions.get(this.currentFunction.name);
      if (funcInfo) {
        funcInfo.localVariables = new Map(this.currentFunction.localVariables);
      }
    }
    this.currentFunction = null;
  }

  addLocalVariable(name, type) {
    if (this.currentFunction) {
      this.currentFunction.localVariables.set(name, type);
    }
    this.addVariable(name, type);
  }

  // CHANGED: Now uses object property assignment
  registerParser(type, parser) {
    this.parsers[type] = parser;
  }

  // CHANGED: Now uses object property access
  getParser(type) {
    return this.parsers[type];
  }

  // C to Java type mapping
  mapTypeToJava(cType) {
    const typeMap = {
      // Primitive types
      'int': 'int',
      'short': 'short',
      'long': 'long',
      'float': 'float',
      'double': 'double',
      'char': 'char',
      'bool': 'boolean',
      'void': 'void',
      
      // Arrays
      'int[]': 'int[]',
      'float[]': 'float[]',
      'double[]': 'double[]',
      'char[]': 'char[]',
      'String[]': 'String[]',
      
      // Strings
      'char*': 'String',
      'const char*': 'String',
      
      // Standard C types to Java
      'size_t': 'int',
      'FILE*': 'Object',
      'time_t': 'long'
    };

    // Check exact match
    if (typeMap[cType]) {
      return typeMap[cType];
    }

    // Check for array types
    if (cType.endsWith('[]')) {
      const elementType = cType.slice(0, -2);
      const javaElementType = this.mapTypeToJava(elementType);
      return javaElementType + '[]';
    }

    // Check for pointer types
    if (cType.includes('*')) {
      const baseType = cType.replace(/\*/g, '').trim();
      if (baseType === 'char') {
        return 'String';
      }
      return this.mapTypeToJava(baseType) + '[]';
    }

    // Default to Object for unknown types
    return 'Object';
  }

  // C function to Java method mapping
  mapFunctionToJava(cFunction) {
    const functionMap = {
      'printf': 'System.out.printf',
      'scanf': 'Scanner',
      'strlen': '.length()',
      'strcpy': 'String.copyValueOf',
      'strcat': 'String.concat',
      'malloc': 'new',
      'free': '// GC handles this',
      'sizeof': '.length'
    };

    return functionMap[cFunction] || cFunction;
  }

  getFunctionInfo(name) {
    return this.functions.get(name);
  }

  clear() {
    this.variables.clear();
    this.currentFunction = null;
  }
}