import { TypeMapper } from '../../../core/type-mapper.js';

export class ArraysGenerator {
  canGenerate(astNode) {
    return astNode && (astNode.type === 'array_declaration' || astNode.type === 'array_literal');
  }

  generate(astNode, context) {
    if (astNode.type === 'array_declaration') {
      return this.generateArrayDeclaration(astNode, context);
    } else if (astNode.type === 'array_literal') {
      return this.generateArrayLiteral(astNode, context);
    }
    return '';
  }

  generateArrayDeclaration(astNode, context) {
    const { name, elementType, values } = astNode;
    console.log(`Generating array: name=${name}, elementType=${elementType}, values=${values?.length}`);
    
    // Map Python type to Java type
    let javaElementType = this.mapElementType(elementType);
    const indent = context.getIndent();
    
    // Generate array initialization
    let valueStr = '';
    if (values && values.length > 0) {
      const javaValues = values.map(v => this.valueToJava(v)).join(', ');
      
      // Use simple array initialization for common types
      if (['String', 'int', 'float', 'boolean'].includes(javaElementType)) {
        valueStr = ` = {${javaValues}}`;
      } else {
        // For Object and other types
        valueStr = ` = new ${javaElementType}[] {${javaValues}}`;
      }
    } else {
      // Empty array
      if (['String', 'int', 'float', 'boolean'].includes(javaElementType)) {
        valueStr = ` = new ${javaElementType}[0]`;
      } else {
        valueStr = ` = new ${javaElementType}[0]`;
      }
    }
    
    console.log(`Generated array: ${javaElementType}[] ${name}${valueStr}`);
    return `${indent}${javaElementType}[] ${name}${valueStr};`;
  }

  generateArrayLiteral(astNode, context) {
    const { elementType, values } = astNode;
    const javaElementType = this.mapElementType(elementType);
    
    if (values && values.length > 0) {
      const javaValues = values.map(v => this.valueToJava(v)).join(', ');
      return `new ${javaElementType}[] {${javaValues}}`;
    }
    
    return `new ${javaElementType}[0]`;
  }

  mapElementType(pythonType) {
    // Direct mapping for common types
    switch(pythonType.toLowerCase()) {
      case 'string':
      case 'str':
        return 'String';
      case 'int':
      case 'integer':
        return 'int';
      case 'float':
      case 'double':
        return 'float';
      case 'bool':
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'Object';
      default:
        // If it's already a Java type, use it
        if (pythonType.endsWith('[]')) {
          return pythonType;
        }
        return 'Object';
    }
  }

  valueToJava(value) {
    if (!value) return '';
    
    switch (value.type) {
      case 'string':
        return `"${value.value}"`;
      
      case 'number':
        return value.value;
      
      case 'boolean':
        return value.value ? 'true' : 'false';
      
      case 'variable':
        return value.name;
      
      default:
        console.log('Unknown value type in array:', value.type);
        return '';
    }
  }
}