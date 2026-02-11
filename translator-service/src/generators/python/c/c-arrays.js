import { ArrayDeclaration } from '../../../core/ast-nodes.js';

export class ArraysGenerator {
  canGenerate(astNode) {
    return astNode.type === 'array_declaration' || 
           astNode.type === 'array_access' ||
           astNode.type === 'array_initializer' ||
           astNode.type === 'string_literal';
  }

  generate(astNode, context) {
    console.log(`DEBUG ArraysGenerator: Generating for type: ${astNode.type}`);
    
    switch (astNode.type) {
      case 'array_declaration':
        return this.generateArrayDeclaration(astNode, context);
      case 'array_access':
        return this.generateArrayAccess(astNode, context);
      case 'array_initializer':
      case 'initializer_list':
        return this.generateArrayInitializer(astNode, context);
      case 'string_literal':
        return this.generateStringLiteral(astNode, context);
      default:
        console.log(`DEBUG ArraysGenerator: Unhandled type: ${astNode.type}`);
        return '';
    }
  }

  generateArrayDeclaration(astNode, context) {
    const { name, data_type, value, arraySize, arrayDimensions, isArray } = astNode;
    
    console.log(`DEBUG ArraysGenerator: Generating array declaration: ${name}, type: ${data_type}`);
    
    if (data_type && data_type.includes('char')) {
      // Character array -> Python string
      if (value && value.type === 'string_literal') {
        let strValue = value.value || '';
        // Remove surrounding quotes if present
        if (strValue.startsWith('"') && strValue.endsWith('"')) {
          strValue = strValue.substring(1, strValue.length - 1);
        }
        // Escape for Python
        strValue = this.escapeString(strValue);
        return `${name} = "${strValue}"`;
      } else if (value && value.type === 'array_initializer') {
        // char array with initializer list
        const elements = this.extractArrayElements(value);
        if (elements.length > 0) {
          // Convert char array to string
          let str = elements.map(el => {
            if (el.type === 'char_literal') {
              let charVal = el.value || "''";
              if (charVal.startsWith("'") && charVal.endsWith("'")) {
                charVal = charVal.substring(1, charVal.length - 1);
              }
              return charVal;
            }
            return '';
          }).join('');
          
          str = this.escapeString(str);
          return `${name} = "${str}"`;
        }
      }
      return `${name} = ""`; // Default empty string
    } else {
      // Non-char array -> Python list
      if (value && value.type === 'array_initializer') {
        const elements = this.extractArrayElements(value);
        const pythonElements = elements.map(el => this.convertElement(el, context));
        return `${name} = [${pythonElements.join(', ')}]`;
      } else if (value && value.type === 'string_literal') {
        // Handle string assignment to array variable
        let strValue = value.value || '';
        if (strValue.startsWith('"') && strValue.endsWith('"')) {
          strValue = strValue.substring(1, strValue.length - 1);
        }
        strValue = this.escapeString(strValue);
        return `${name} = "${strValue}"`;
      } else {
        // Empty array with size
        if (arraySize) {
          return `${name} = [None] * ${arraySize}`;
        } else if (arrayDimensions && arrayDimensions.length > 0) {
          // Multi-dimensional array
          return this.generateMultiDimArray(name, arrayDimensions, context);
        } else {
          return `${name} = []`; // Empty list
        }
      }
    }
  }

  generateArrayAccess(astNode, context) {
    const { array, index } = astNode;
    
    console.log(`DEBUG ArraysGenerator: Generating array access: ${array}[${index}]`);
    
    // Handle multi-dimensional arrays
    if (index && index.includes('[') && index.includes(']')) {
      // Already has bracket notation
      return `${array}${index}`;
    }
    
    return `${array}[${index}]`;
  }

  generateArrayInitializer(astNode, context) {
    const elements = this.extractArrayElements(astNode);
    
    if (elements.length === 0) {
      return '[]';
    }
    
    const pythonElements = elements.map(el => this.convertElement(el, context));
    return `[${pythonElements.join(', ')}]`;
  }

  generateStringLiteral(astNode, context) {
    let value = astNode.value || '';
    
    // Remove surrounding quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    
    // Escape for Python
    value = this.escapeString(value);
    return `"${value}"`;
  }

  generateMultiDimArray(name, dimensions, context) {
    // Create nested lists for multi-dimensional arrays
    let inner = 'None';
    
    // Build from innermost to outermost
    for (let i = dimensions.length - 1; i >= 0; i--) {
      const dim = dimensions[i];
      if (dim) {
        inner = `[${inner}] * ${dim}`;
      } else {
        inner = `[${inner}]`;
      }
    }
    
    // Replace the innermost None with proper list
    inner = inner.replace(/\[None\]/, '[]');
    
    return `${name} = ${inner}`;
  }

  extractArrayElements(arrayNode) {
    const elements = [];
    
    if (arrayNode.value && arrayNode.value.elements) {
      return arrayNode.value.elements;
    } else if (arrayNode.elements) {
      return arrayNode.elements;
    }
    
    // Try to parse from text if available
    if (arrayNode.text) {
      const cleanText = arrayNode.text.replace(/[\{\}]/g, '').trim();
      if (cleanText) {
        const parts = cleanText.split(',').map(p => p.trim()).filter(p => p);
        for (const part of parts) {
          if (part.startsWith('"') && part.endsWith('"')) {
            elements.push({
              type: 'string_literal',
              value: part
            });
          } else if (part.startsWith("'") && part.endsWith("'")) {
            elements.push({
              type: 'char_literal',
              value: part
            });
          } else if (/^-?\d+$/.test(part)) {
            elements.push({
              type: 'literal',
              value: part,
              data_type: 'int'
            });
          } else if (/^-?\d*\.\d+$/.test(part)) {
            elements.push({
              type: 'literal',
              value: part,
              data_type: 'float'
            });
          }
        }
      }
    }
    
    return elements;
  }

  convertElement(element, context) {
    if (!element) return 'None';
    
    if (element.type === 'literal') {
      return element.value || '0';
    } else if (element.type === 'string_literal') {
      let value = element.value || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      value = this.escapeString(value);
      return `"${value}"`;
    } else if (element.type === 'char_literal') {
      let value = element.value || "''";
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      return `'${value}'`;
    } else if (element.type === 'array_initializer' || element.type === 'initializer_list') {
      return this.generateArrayInitializer(element, context);
    } else if (element.type === 'identifier') {
      return element.name || element.value || 'None';
    }
    
    return JSON.stringify(element);
  }

  escapeString(str) {
    return str
      .replace(/\\/g, '\\\\')    // Escape backslashes
      .replace(/"/g, '\\"')      // Escape double quotes
      .replace(/'/g, "\\'")      // Escape single quotes
      .replace(/\n/g, '\\n')     // Escape newlines
      .replace(/\t/g, '\\t')     // Escape tabs
      .replace(/\r/g, '\\r');    // Escape carriage returns
  }
}