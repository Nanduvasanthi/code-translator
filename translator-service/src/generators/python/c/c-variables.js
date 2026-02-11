import { VariableDeclaration } from '../../../core/ast-nodes.js';

export class VariablesGenerator {
  canGenerate(astNode) {
    return astNode.type === 'variable_declaration' || 
           (Array.isArray(astNode) && astNode[0] && astNode[0].type === 'variable_declaration');
  }

  generate(astNode, context) {
    console.log(`DEBUG VariablesGenerator: Generating node type: ${astNode.type}`);
    
    // Handle multiple declarations array
    if (Array.isArray(astNode) && astNode[0] && astNode[0].type === 'variable_declaration') {
      console.log(`DEBUG VariablesGenerator: Processing multiple declarations array with ${astNode.length} items`);
      return astNode.map(varDecl => this.generateSingle(varDecl, context)).join('\n');
    }
    
    // Handle single declaration
    return this.generateSingle(astNode, context);
  }

  generateSingle(astNode, context) {
    const { name, data_type, value } = astNode;
    
    console.log(`DEBUG VariablesGenerator: Generating for ${name}, type: ${data_type}, value:`, value);
    
    // Convert C type to Python initialization
    if (value) {
      const pythonValue = this.convertValue(value, data_type, context);
      return `${name} = ${pythonValue}`;
    } else {
      // For uninitialized variables, set to None or appropriate default
      const defaultValue = this.getDefaultValue(data_type);
      return `${name} = ${defaultValue}`;
    }
  }

  convertValue(value, dataType, context) {
    console.log(`DEBUG VariablesGenerator.convertValue:`, value, 'type:', dataType);
    
    // If value is an object with type property
    if (typeof value === 'object' && value !== null) {
      // Handle string values
      if (value.type === 'string_literal') {
        let strValue = value.value || '';
        // Remove surrounding quotes if present
        if (strValue.startsWith('"') && strValue.endsWith('"')) {
          strValue = strValue.substring(1, strValue.length - 1);
        }
        // Escape for Python
        strValue = strValue
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'")
          .replace(/\n/g, '\\n')
          .replace(/\t/g, '\\t');
        return `"${strValue}"`;
      }
      
      // Handle character values
      if (value.type === 'char_literal') {
        let charValue = value.value || "''";
        // Remove surrounding single quotes if present
        if (charValue.startsWith("'") && charValue.endsWith("'")) {
          charValue = charValue.substring(1, charValue.length - 1);
        }
        return `'${charValue}'`;
      }
      
      // Handle literal values (numbers, booleans)
      if (value.type === 'literal') {
        const val = value.value;
        
        // Handle boolean values
        if (dataType === 'bool' || dataType === '_Bool') {
          return val === 'true' ? 'True' : 'False';
        }
        
        // Handle float values (remove 'f' suffix)
        if (typeof val === 'string' && val.endsWith('f')) {
          return val.slice(0, -1);
        }
        
        // Handle long double (just remove 'L' suffix)
        if (typeof val === 'string' && val.endsWith('L')) {
          return val.slice(0, -1);
        }
        
        return val;
      }
      
      // Handle identifier references
      if (value.type === 'identifier') {
        return value.name || value.value || 'None';
      }
      
      // Handle array initializers
      if (value.type === 'array_initializer' || value.type === 'initializer_list') {
        return this.convertArrayValue(value, dataType, context);
      }
      
      // NEW: Handle ternary expressions
      if (value.type === 'expression' && value.value && value.value.includes('?')) {
        // Convert C ternary to Python ternary
        return this.convertTernaryExpression(value.value, context);
      }
      
      // Fallback: try to get value property
      return value.value || JSON.stringify(value);
    }
    
    // Handle string values directly
    if (typeof value === 'string') {
      // Check if it's a string literal
      if (value.startsWith('"') && value.endsWith('"')) {
        let strValue = value.substring(1, value.length - 1);
        strValue = strValue
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'")
          .replace(/\n/g, '\\n')
          .replace(/\t/g, '\\t');
        return `"${strValue}"`;
      }
      
      // Check if it's a char literal
      if (value.startsWith("'") && value.endsWith("'")) {
        let charValue = value.substring(1, value.length - 1);
        return `'${charValue}'`;
      }
      
      // Handle boolean values
      if (dataType === 'bool' || dataType === '_Bool') {
        return value === 'true' ? 'True' : 'False';
      }
      
      // NEW: Handle string with ternary expression
      if (value.includes('?')) {
        return this.convertTernaryExpression(value, context);
      }
      
      return value;
    }
    
    return JSON.stringify(value);
  }

  // NEW METHOD: Convert C ternary to Python ternary
  convertTernaryExpression(expr, context) {
    console.log(`DEBUG VariablesGenerator.convertTernaryExpression: "${expr}"`);
    
    // Remove any extra whitespace
    expr = expr.trim();
    
    // Pattern 1: (condition) ? trueValue : falseValue
    const pattern1 = /\((.*?)\)\s*\?\s*(.*?)\s*:\s*(.*)/;
    const match1 = expr.match(pattern1);
    
    if (match1) {
      const [, condition, trueValue, falseValue] = match1;
      const cleanCondition = condition.trim();
      const cleanTrueValue = trueValue.trim();
      const cleanFalseValue = falseValue.trim();
      
      // Ensure string values are quoted
      const formattedTrueValue = this.ensureQuoted(cleanTrueValue);
      const formattedFalseValue = this.ensureQuoted(cleanFalseValue);
      
      return `${formattedTrueValue} if ${cleanCondition} else ${formattedFalseValue}`;
    }
    
    // Pattern 2: condition ? trueValue : falseValue (without outer parentheses)
    const pattern2 = /(.*?)\s*\?\s*(.*?)\s*:\s*(.*)/;
    const match2 = expr.match(pattern2);
    
    if (match2) {
      const [, condition, trueValue, falseValue] = match2;
      const cleanCondition = condition.trim();
      const cleanTrueValue = trueValue.trim();
      const cleanFalseValue = falseValue.trim();
      
      // Ensure string values are quoted
      const formattedTrueValue = this.ensureQuoted(cleanTrueValue);
      const formattedFalseValue = this.ensureQuoted(cleanFalseValue);
      
      return `${formattedTrueValue} if ${cleanCondition} else ${formattedFalseValue}`;
    }
    
    // If no match, return the expression as-is
    return expr;
  }

  // NEW HELPER METHOD: Ensure string values are properly quoted
  ensureQuoted(value) {
    // If it's already quoted, return as-is
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value;
    }
    
    // Check if it looks like a string literal (letters, spaces, etc.)
    // Simple heuristic: if it starts with a letter or contains only word characters
    if (/^[a-zA-Z_]/.test(value) && /^[a-zA-Z0-9_\s]*$/.test(value)) {
      return `"${value}"`;
    }
    
    // Otherwise return as-is (could be a number, variable name, etc.)
    return value;
  }

  convertArrayValue(value, dataType, context) {
  console.log(`DEBUG VariablesGenerator.convertArrayValue:`, value, 'dataType:', dataType);
  
  // Check for char*[] type (array of strings) FIRST
  if (dataType && (dataType === 'char*[]' || dataType === 'char*[][]')) {
    // char*[] -> Python list of strings
    if (value.value && value.value.elements) {
      const elements = value.value.elements.map(el => {
        if (el.type === 'string_literal') {
          let str = el.value || '';
          if (str.startsWith('"') && str.endsWith('"')) {
            str = str.substring(1, str.length - 1);
          }
          // Escape for Python
          str = str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t');
          return `"${str}"`;
        }
        return '""';
      });
      return `[${elements.join(', ')}]`;
    }
    return '[]';
  }
  // Check for char[] type (character array) - but NOT char*[]
  else if (dataType && dataType.includes('char') && !dataType.includes('*')) {
    // char[] -> Python string for string literals, list for character arrays
    if (value.value && value.value.elements) {
      const elements = value.value.elements;
      
      // Check if first element is a string_literal (e.g., "John")
      if (elements.length > 0 && elements[0].type === 'string_literal') {
        let str = elements[0].value || '';
        if (str.startsWith('"') && str.endsWith('"')) {
          str = str.substring(1, str.length - 1);
        }
        // Escape for Python
        str = str
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'")
          .replace(/\n/g, '\\n')
          .replace(/\t/g, '\\t');
        return `"${str}"`;
      }
      
      // For character arrays like {'a', 'e', 'i', 'o', 'u'}, create a list of characters
      if (elements.length > 0 && elements[0].type === 'char_literal') {
        // Build list from character literals
        const chars = elements.map(el => {
          if (el.type === 'char_literal') {
            let charVal = el.value || "''";
            if (charVal.startsWith("'") && charVal.endsWith("'")) {
              charVal = charVal.substring(1, charVal.length - 1);
            }
            return `'${charVal}'`;
          }
          return "''";
        });
        return `[${chars.join(', ')}]`;
      }
    }
    return '""';
  } else {
    // Other array -> Python list
    if (value.value && value.value.elements) {
      const elements = value.value.elements.map(el => {
        if (el.type === 'literal') {
          return el.value;
        } else if (el.type === 'string_literal') {
          let str = el.value || '';
          if (str.startsWith('"') && str.endsWith('"')) {
            str = str.substring(1, str.length - 1);
          }
          str = str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t');
          return `"${str}"`;
        } else if (el.type === 'char_literal') {
          let charVal = el.value || "''";
          if (charVal.startsWith("'") && charVal.endsWith("'")) {
            charVal = charVal.substring(1, charVal.length - 1);
          }
          return `'${charVal}'`;
        } else if (el.type === 'initializer_list' || el.type === 'array_initializer') {
          // Handle nested arrays (for multi-dimensional arrays)
          // Recursively convert nested array
          const nestedResult = this.convertArrayValue({ value: el }, 'nested', context);
          // Return the nested result - it should already be a list
          return nestedResult;
        } else if (el.type === 'literal' && el.value && el.value.includes('{')) {
          // Handle literal values that look like nested arrays (e.g., "{1, 2, 3}")
          // This is a workaround for the parsing issue
          const innerElements = el.value.replace(/[{}]/g, '').split(',').map(v => v.trim());
          return `[${innerElements.join(', ')}]`;
        }
        // For unknown types, try to get a string representation
        try {
          if (el.value !== undefined) {
            return String(el.value);
          }
        } catch (e) {
          // ignore
        }
        return 'None';
      });
      
      // Check if we have nested array syntax that needs fixing
      const result = `[${elements.join(', ')}]`;
      
      // Fix nested array syntax: replace [{...}, {...}] with [[...], [...]]
      // This handles cases where elements are already lists
      const fixedResult = result.replace(/\{/g, '[').replace(/\}/g, ']');
      
      return fixedResult;
    }
    return '[]';
  }
}

  getDefaultValue(dataType) {
    const typeMap = {
      'int': '0',
      'float': '0.0',
      'double': '0.0',
      'char': "''",
      'bool': 'False',
      '_Bool': 'False',
      'short': '0',
      'long': '0',
      'unsigned': '0',
      'void*': 'None',
      'char[]': '""',
      'char*': '""'
    };
    
    return typeMap[dataType] || 'None';
  }
}