import { VariableDeclaration } from '../../core/ast-nodes.js';

export class VariablesParser {
  canParse(node) {
    return node.type === 'local_variable_declaration';
  }

  parse(node, context) {
    console.log('=== DEBUG Parsing Variable ===');
    console.log('Full text:', node.text);
    console.log('Node type:', node.type);
    
    let name = '';
    let javaType = '';
    let valueNode = null;
    
    // Log all direct children
    console.log('Direct children:');
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      console.log(`  [${i}] ${child.type}: "${child.text}"`);
    }
    
    // Extract type and name
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'integral_type' || 
          child.type === 'floating_point_type' || 
          child.type === 'boolean_type' ||
          child.type === 'void_type' ||
          child.type === 'type_identifier') {
        javaType = child.text;
        console.log('Found type:', javaType);
      } else if (child.type === 'variable_declarator') {
        console.log('Found variable_declarator:', child.text);
        // Get variable name and optional value
        for (let j = 0; j < child.childCount; j++) {
          const grandChild = child.child(j);
          console.log(`  Grand child [${j}] ${grandChild.type}: "${grandChild.text}"`);
          
          if (grandChild.type === 'identifier') {
            name = grandChild.text;
            console.log('Found name:', name);
          } else if (grandChild.type === '=') {
            // Get value after '='
            if (j + 1 < child.childCount) {
              valueNode = child.child(j + 1);
              console.log('Found value node:', valueNode.type, valueNode.text);
            }
          }
        }
      }
    }
    
    let value = null;
    if (valueNode) {
      console.log('Parsing value node:', valueNode.type, valueNode.text);
      value = this.parseValue(valueNode, javaType, context);
      console.log('Parsed value:', value);
    }
    
    // Register variable in context
    context.addVariable(name, javaType, value);
    
    console.log('=== END DEBUG ===\n');
    
    return new VariableDeclaration(name, javaType, value);
  }

  parseValue(node, javaType, context) {
    console.log('parseValue called with:', node.type, node.text);
    
    // Check for decimal_integer_literal (Tree-sitter Java uses this for integers)
    if (node.type === 'decimal_integer_literal' || node.type === 'integer_literal') {
      let val = node.text;
      // Remove L/l suffix for long literals
      if (val.endsWith('L') || val.endsWith('l')) {
        val = val.slice(0, -1);
      }
      return { type: 'literal', value: parseInt(val), data_type: javaType };
      
    } else if (node.type === 'decimal_floating_point_literal' || node.type === 'float_literal') {
      let val = node.text;
      // Remove F/f suffix for float literals
      if (val.endsWith('F') || val.endsWith('f')) {
        val = val.slice(0, -1);
      }
      return { type: 'literal', value: parseFloat(val), data_type: javaType };
      
    } else if (node.type === 'character_literal') {
      const text = node.text;
      const charValue = text.length >= 3 ? text.substring(1, text.length - 1) : '';
      return { type: 'literal', value: charValue, data_type: javaType };
      
    } else if (node.type === 'string_literal') {
      const text = node.text;
      const strValue = text.length >= 2 ? text.substring(1, text.length - 1) : '';
      return { type: 'literal', value: strValue, data_type: javaType };
      
    } else if (node.type === 'true' || node.type === 'false') {
      return { type: 'literal', value: node.type === 'true', data_type: javaType };
      
    } else if (node.type === 'identifier') {
      return { type: 'identifier', name: node.text, data_type: 'object' };
      
    } else if (node.type === 'array_initializer') {
      // Handle array literals like {1, 2, 3}
      const elements = [];
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type !== '{' && child.type !== '}' && child.type !== ',') {
          elements.push(this.parseValue(child, this.getArrayElementType(javaType), context));
        }
      }
      return { type: 'array_literal', elements: elements, data_type: javaType };
    }
    
    console.log('Unknown node type for value:', node.type, node.text);
    return { type: 'unknown', value: node.text, data_type: javaType };
  }

  getArrayElementType(arrayType) {
    if (arrayType.endsWith('[]')) {
      return arrayType.slice(0, -2);
    }
    return 'Object';
  }
}