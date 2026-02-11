export const TypeMapper = {
  /* ---------------- PYTHON → JAVA ---------------- */
  pythonToJava: {
    int: 'int',
    float: 'double',
    str: 'String',
    bool: 'boolean',
    list: 'ArrayList',
    None: 'void'
  },

  mapPythonToJava(type) {
    return this.pythonToJava[type] || 'Object';
  },

  /* ---------------- C → JAVA ---------------- */
  cToJava: {
    char: 'char',
    short: 'short',
    int: 'int',
    long: 'long',
    float: 'float',
    double: 'double',
    'long double': 'double',
    bool: 'boolean',
    void: 'void',
    'char*': 'String',
    'char *':'String',
    'const char*':'String',
    'const char *':'String'
  },

  mapCToJava(type) {
    if (type.includes('*')) {
      // Handle pointer types
      if (type.includes('char')) {
        return 'String';
      }
      // For other pointers, remove * and map base type
      const baseType = type.replace(/\*/g, '').trim();
      return this.cToJava[baseType] || 'Object';
    }
    
    if (type.includes('[') && type.includes(']')) {
      // Handle array types
      const baseType = type.replace(/\[\d*\]/g, '').trim();
      const javaBaseType = this.cToJava[baseType] || baseType;
      return `${javaBaseType}[]`;
    }
    
    return this.cToJava[type] || 'Object';
},
javaToPython: {
    'byte': 'int',
    'short': 'int',
    'int': 'int',
    'long': 'int',
    'float': 'float',
    'double': 'float',
    'char': 'str',
    'boolean': 'bool',
    'String': 'str',
    'void': 'None',
    'Object': 'object',
    'ArrayList': 'list',
    'List': 'list',
    'HashMap': 'dict',
    'Map': 'dict',
    'HashSet': 'set',
    'Set': 'set'
  },

  mapJavaToPython(type) {
    if (!type) return 'object';
    
    // Handle arrays
    if (type.endsWith('[]')) {
      return 'list';
    }
    
    // Handle generic types like ArrayList<String>
    if (type.includes('<')) {
      const baseType = type.split('<')[0];
      return this.javaToPython[baseType] || 'object';
    }
    
    // Handle primitive and common types
    return this.javaToPython[type] || 'object';
  },

  /* ---------------- UTILITY METHODS ---------------- */
  
  // Check if type is numeric in Java
  isJavaNumeric(type) {
    const numericTypes = ['byte', 'short', 'int', 'long', 'float', 'double'];
    return numericTypes.includes(type);
  },
  
  // Check if type is numeric in Python
  isPythonNumeric(type) {
    const numericTypes = ['int', 'float'];
    return numericTypes.includes(type);
  },
  
  // Check if type is string in Java
  isJavaString(type) {
    return type === 'String' || type === 'char';
  },
  
  // Check if type is string in Python
  isPythonString(type) {
    return type === 'str';
  },
  
  // Check if type is boolean
  isBoolean(type) {
    return type === 'boolean' || type === 'bool';
  }

};
