// generators/java/c-generator-base.js
export class CJavaGeneratorBase {
  constructor() {
    this.typeMap = {
      'int': 'int',
      'float': 'double',
      'char': 'String', // In Java, single chars are String
      'String': 'String',
      'bool': 'boolean',
      'void': 'void'
    };
    this.outputLines = [];
    this.lastLine = 0;
  }

  // Preserve original line spacing
  addWithSpacing(line, startLine) {
    // Add empty lines to maintain original spacing
    if (this.outputLines.length > 0 && startLine > this.lastLine + 1) {
      const emptyLines = startLine - this.lastLine - 1;
      for (let i = 0; i < emptyLines; i++) {
        this.outputLines.push('');
      }
    }
    this.outputLines.push(line);
    this.lastLine = startLine;
  }

  generateComplete(astNodes) {
    // Sort nodes by line number to maintain order
    const sortedNodes = [...astNodes].sort((a, b) => 
      (a._position?.startLine || 0) - (b._position?.startLine || 0)
    );

    sortedNodes.forEach(node => {
      const generated = this.generate(node);
      if (generated && node._position) {
        this.addWithSpacing(generated, node._position.startLine);
      }
    });

    return this.outputLines.join('\n');
  }

  mapCTypeToJava(cType) {
    const typeMap = {
      'int': 'int',
      'float': 'double',
      'double': 'double',
      'char': 'String', // C char arrays become String in Java
      'char*': 'String',
      'void': 'void',
      'bool': 'boolean',
      '_Bool': 'boolean'
    };
    
    // Handle arrays
    if (cType.includes('[')) {
      const baseType = cType.split('[')[0].trim();
      const javaBaseType = typeMap[baseType] || 'Object';
      return javaBaseType + '[]';
    }
    
    // Handle pointers
    if (cType.endsWith('*')) {
      const baseType = cType.slice(0, -1).trim();
      if (baseType === 'char') return 'String';
      return typeMap[baseType] || 'Object';
    }
    
    return typeMap[cType] || 'Object';
  }

  generateLiteral(value, dataType) {
    if (dataType === 'String') {
      return `"${value}"`;
    } else if (dataType === 'char') {
      return `"${value}"`; // C char becomes Java String
    } else if (dataType === 'boolean') {
      return value ? 'true' : 'false';
    }
    return value.toString();
  }
}