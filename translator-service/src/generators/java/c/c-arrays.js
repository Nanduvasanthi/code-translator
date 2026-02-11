// src/generators/java/c-arrays.js
export class CArrayGenerator {
  
  generate(astNode, context, visitor) {
    if (!astNode) return '';
    
    console.log(`DEBUG CArrayGenerator: Generating for ${astNode.type}`);
    
    switch (astNode.type) {
      case 'array_declaration':
        return this.generateArrayDeclaration(astNode, context, visitor);
      case 'init_declarator':
        return this.generateInitDeclarator(astNode, context, visitor);
      case 'subscript_expression':
        return this.generateSubscriptExpression(astNode, context, visitor);
      case 'initializer_list':
        return this.generateInitializerList(astNode, context, visitor);
      default:
        console.log(`DEBUG CArrayGenerator: Unhandled type: ${astNode.type}`);
        return '';
    }
  }

  generateArrayDeclaration(node, context, visitor) {
    const { name, data_type, value, dimensions = [] } = node;
    
    console.log(`DEBUG CArrayGenerator: Generating array declaration: ${name}, type: ${data_type}, dims: ${dimensions.length}`);
    
    const baseType = this.mapCTypeToJava(data_type);
    
    // Handle multi-dimensional arrays
    if (dimensions.length > 0) {
      return this.generateMultiDimArray(node, context, visitor);
    }
    
    // Handle char array string initialization
    if (baseType === 'char' && value && value.type === 'string_literal') {
      return this.generateCharArrayFromString(name, value);
    }
    
    // Handle regular array with initializer
    if (value && value.type === 'array_initializer') {
      const initList = this.generateInitializerList(value, context, visitor);
      return `${baseType}[] ${name} = ${initList};`;
    }
    
    // Handle sized array declaration without initializer
    if (node.size) {
      return `${baseType}[] ${name} = new ${baseType}[${node.size}];`;
    }
    
    return `${baseType}[] ${name};`;
  }

  generateMultiDimArray(node, context, visitor) {
    const { name, data_type, value, dimensions = [] } = node;
    const baseType = this.mapCTypeToJava(data_type);
    
    // Create Java array type with correct brackets
    const dimBrackets = '[]'.repeat(dimensions.length);
    
    if (value && value.type === 'array_initializer') {
      // Initialize with values
      const initList = this.generateMultiDimInitializerList(value, context, visitor);
      return `${baseType}${dimBrackets} ${name} = ${initList};`;
    } else {
      // Create empty array with dimensions
      const sizes = dimensions.map(dim => `[${dim}]`).join('');
      return `${baseType}${dimBrackets} ${name} = new ${baseType}${sizes};`;
    }
  }

  generateInitDeclarator(node, context, visitor) {
    const { declarator, initializer } = node;
    
    if (!initializer) {
      return `${declarator};`;
    }
    
    // Check if this is an array initialization
    if (initializer.type === 'array_initializer') {
      const initList = this.generateInitializerList(initializer, context, visitor);
      return `${declarator} = ${initList};`;
    }
    
    // Handle string literal for char arrays
    if (initializer.type === 'string_literal') {
      // Check if declarator is a char array
      if (declarator.includes('[') && declarator.includes(']')) {
        const charArrayInit = this.convertStringToCharArray(initializer.value);
        return `${declarator} = ${charArrayInit};`;
      } else {
        // Regular assignment
        return `${declarator} = ${initializer.value};`;
      }
    }
    
    return `${declarator} = ${this.generateExpression(initializer, context, visitor)};`;
  }

  generateSubscriptExpression(node, context, visitor) {
    const { array, subscript } = node;
    let arrayName = array;
    
    // Handle nested array access like matrix[1][2]
    if (typeof subscript === 'object' && subscript.type === 'subscript_expression') {
      const innerAccess = this.generateSubscriptExpression(subscript, context, visitor);
      return `${arrayName}[${innerAccess}]`;
    }
    
    return `${arrayName}[${this.generateExpression(subscript, context, visitor)}]`;
  }

  generateInitializerList(node, context, visitor) {
    const elements = node.elements || [];
    const javaElements = [];
    
    for (const element of elements) {
      if (element.type === 'literal') {
        javaElements.push(element.value);
      } else if (element.type === 'char_literal') {
        // Convert C char literal to Java
        const charValue = element.value.replace(/'/g, '');
        javaElements.push(`'${charValue}'`);
      } else if (element.type === 'string_literal') {
        javaElements.push(element.value);
      } else if (element.type === 'initializer_list') {
        // Nested array initialization
        javaElements.push(this.generateInitializerList(element, context, visitor));
      } else if (element.type === 'array_initializer') {
        // Multi-dimensional array
        javaElements.push(this.generateInitializerList(element, context, visitor));
      } else {
        // Handle other expressions
        const elementCode = visitor.visit(element, context);
        javaElements.push(elementCode);
      }
    }
    
    return `{ ${javaElements.join(', ')} }`;
  }

  generateMultiDimInitializerList(node, context, visitor) {
    const elements = node.elements || [];
    const javaElements = [];
    
    for (const element of elements) {
      if (element.type === 'initializer_list') {
        javaElements.push(this.generateMultiDimInitializerList(element, context, visitor));
      } else if (element.type === 'array_initializer') {
        javaElements.push(this.generateInitializerList(element, context, visitor));
      } else {
        const elementCode = visitor.visit(element, context);
        javaElements.push(elementCode);
      }
    }
    
    return `{ ${javaElements.join(', ')} }`;
  }

  generateCharArrayFromString(name, stringLiteralNode) {
    const value = stringLiteralNode.value;
    let content = value;
    
    // Remove quotes
    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.substring(1, content.length - 1);
    }
    
    // For simple string assignments to char arrays, use String in Java
    return `String ${name} = "${content}";`;
  }

  convertStringToCharArray(cString) {
    // Convert C string to Java char array initialization
    let content = cString;
    
    // Remove quotes
    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.substring(1, content.length - 1);
    }
    
    if (content.length === 1) {
      // Single character
      return `new char[] { '${content}' }`;
    }
    
    // Multiple characters
    const chars = content.split('').map(ch => `'${ch}'`).join(', ');
    return `new char[] { ${chars} }`;
  }

  generateExpression(node, context, visitor) {
    // Simple expression generator for literals
    if (node.type === 'literal') {
      return node.value;
    } else if (node.type === 'identifier') {
      return node.name;
    } else {
      return visitor.visit(node, context);
    }
  }

  mapCTypeToJava(cType) {
    const typeMap = {
      'int': 'int',
      'char': 'char',
      'float': 'float',
      'double': 'double',
      'short': 'short',
      'long': 'long',
      'unsigned int': 'int',
      'unsigned char': 'char',
      'signed char': 'byte',
      'void': 'void',
      'bool': 'boolean',
      'char*': 'String'
    };
    
    return typeMap[cType] || cType;
  }

  // Helper method for visitor pattern
  visit(node, context) {
    return this.generate(node, context, this);
  }
}

export default {
  generate: function(node, context, visitor) {
    const generator = new CArrayGenerator();
    return generator.generate(node, context, visitor);
  }
};