import { ArrayDeclaration } from '../../core/ast-nodes.js';

export class ArraysParser {
  canParse(node) {
    // Check if it's a local variable declaration AND contains array syntax
    if (node.type !== 'local_variable_declaration') {
      return false;
    }
    
    // Check for array brackets [] in the text
    const text = node.text;
    return text.includes('[]') || 
           (text.includes('{') && text.includes('}')) ||
           this.isArrayType(node);
  }

  isArrayType(node) {
    // Check if the type is an array type by examining children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'array_type') {
        return true;
      }
    }
    return false;
  }

  parse(node, context) {
    console.log('=== DEBUG ArraysParser ===');
    console.log('Parsing possible array node:', node.type);
    console.log('Text:', node.text.substring(0, 100));
    
    // Double-check that we should parse this
    if (!this.canParse(node)) {
      console.log('Not actually an array, returning null');
      return null;
    }
    
    // Check if it's an array declaration
    if (node.type === 'local_variable_declaration') {
      return this.parseArrayDeclaration(node, context);
    }
    
    return null;
  }

  parseArrayDeclaration(node, context) {
    console.log('=== DEBUG parseArrayDeclaration ===');
    
    let arrayName = null;
    let elementType = null;
    let values = [];
    
    // Look for array type and name
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'array_type') {
        // Parse array type like "String[]"
        elementType = this.parseArrayType(child);
        console.log('Found array type:', elementType);
      } else if (child.type === 'type_identifier' && !elementType) {
        // Fallback: regular type identifier (might be part of array type)
        elementType = child.text;
      } else if (child.type === 'variable_declarator') {
        // Parse variable name and initializer
        const declarator = this.parseVariableDeclarator(child, context);
        arrayName = declarator.name;
        values = declarator.values;
        console.log('Found array name:', arrayName);
        console.log('Found array values:', values);
      }
    }
    
    if (arrayName && elementType) {
      console.log('Creating ArrayDeclaration');
      return new ArrayDeclaration(arrayName, elementType, values);
    }
    
    console.log('Could not parse array declaration');
    return null;
  }

  parseArrayType(node) {
    // Extract the base type from array type (e.g., "String" from "String[]")
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'type_identifier') {
        return child.text; // e.g., "String", "int"
      }
    }
    return 'Object'; // default
  }

  parseVariableDeclarator(node, context) {
    const result = {
      name: null,
      values: []
    };
    
    console.log('Parsing variable declarator with', node.childCount, 'children');
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      console.log(`  Declarator child [${i}]: ${child.type}: "${child.text.substring(0, 50)}"`);
      
      if (child.type === 'identifier') {
        result.name = child.text;
        console.log('  Found name:', result.name);
      } else if (child.type === 'array_initializer') {
        result.values = this.parseArrayInitializer(child, context);
        console.log('  Found array initializer values:', result.values);
      } else if (child.type === '=') {
        // Skip assignment operator
        continue;
      } else if (child.type === 'string_literal') {
        // Direct string literal (not in array initializer)
        result.values.push({
          type: 'literal',
          value: child.text.substring(1, child.text.length - 1),
          data_type: 'string'
        });
      } else if (child.type === 'method_invocation') {
        // Handle method calls like numbers.clone()
        console.log('  Found method invocation:', child.text);
        result.values = this.parseMethodInvocation(child, context);
        console.log('  Parsed method invocation values:', result.values);
      }
    }
    
    return result;
  }

  parseArrayInitializer(node, context) {
    const values = [];
    
    console.log('Parsing array initializer with', node.childCount, 'children');
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      console.log(`  Initializer child [${i}]: ${child.type}: "${child.text}"`);
      
      if (child.type === '{' || child.type === '}' || child.type === ',') {
        continue; // Skip braces and commas
      }
      
      if (child.type === 'string_literal') {
        values.push({
          type: 'literal',
          value: child.text.substring(1, child.text.length - 1), // Remove quotes
          data_type: 'string'
        });
      } else if (child.type === 'integer_literal' || child.type === 'decimal_integer_literal') {
        values.push({
          type: 'literal',
          value: parseInt(child.text),
          data_type: 'int'
        });
      } else if (child.type === 'identifier') {
        values.push({
          type: 'identifier',
          name: child.text
        });
      } else if (child.type === 'array_initializer') {
        // Handle nested array initializer (for multi-dimensional arrays)
        console.log('  Found nested array initializer');
        const nestedValues = this.parseArrayInitializer(child, context);
        values.push({
          type: 'array',
          values: nestedValues
        });
      }
    }
    
    console.log('Parsed array values:', values);
    return values;
  }

  parseMethodInvocation(node, context) {
    console.log('=== DEBUG parseMethodInvocation ===');
    console.log('Method:', node.text);
    
    // Handle specific method calls
    if (node.text.includes('.clone()')) {
      // Extract the object being cloned (e.g., "numbers" from "numbers.clone()")
      const match = node.text.match(/^([^\.]+)\.clone\(\)/);
      if (match) {
        const sourceArray = match[1];
        console.log('Found clone() call on array:', sourceArray);
        return [{
          type: 'method_call',
          method: 'clone',
          object: { type: 'identifier', name: sourceArray }
        }];
      }
    }
    
    // Return empty array for other method calls
    return [];
  }
}