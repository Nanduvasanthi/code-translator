// generators/java/c-variables.js - COMPLETE FIXED VERSION
export class CVariableGenerator {
  generate(astNode, context, visitor) {
    console.log(`DEBUG: Generating variable: name=${astNode.name}, type=${astNode.data_type}, value=`, astNode.value);
    
    // ⭐⭐ FIXED: Better string array detection
    if (astNode.data_type && 
        (astNode.data_type.includes('char*') || astNode.data_type.includes('char *')) && 
        astNode.data_type.includes('[]')) {
      return this.generateStringArray(astNode, context, visitor);
    }
    
    // Handle ternary expressions
    if (astNode.value && astNode.value.type === 'ternary_expression') {
      return this.generateVariableWithTernary(astNode, context, visitor);
    }
    
    // Don't automatically convert int 0/1 to boolean
    const isCBoolean = this.isCBooleanVariable(astNode, context);
    
    const javaType = isCBoolean ? 'boolean' : this.mapCTypeToJava(astNode.data_type, astNode.value);
    const name = astNode.name;
    
    // Check if this is an array declaration
    const isArray = astNode.isArray || astNode.data_type.includes('[]');
    
    let declaration = `${javaType} ${name}`;
    
    if (astNode.value) {
      let value;
      if (isCBoolean) {
        // Only convert 0/1 to true/false if it's actually a boolean
        if (astNode.value.type === 'literal') {
          if (astNode.value.value === '1' || astNode.value.value === 1) {
            value = 'true';
          } else if (astNode.value.value === '0' || astNode.value.value === 0) {
            value = 'false';
          } else {
            value = this.generateValue(astNode.value, astNode.data_type, javaType, visitor);
          }
        } else {
          value = this.generateValue(astNode.value, astNode.data_type, javaType, visitor);
        }
      } else {
        // ⭐⭐ FIXED: Better array value handling
        if (astNode.value.type === 'array_initializer') {
          // Use the array initializer
          value = this.generateArrayInitializer(astNode.value.value, visitor, javaType);
        } else if (astNode.arrayInitializer) {
          // Use stored array initializer
          value = this.generateArrayInitializer(astNode.arrayInitializer, visitor, javaType);
        } else {
          value = this.generateValue(astNode.value, astNode.data_type, javaType, visitor);
        }
      }
      
      if (value) {
        declaration += ` = ${value}`;
      }
    }
    
    return declaration + ';';
  }

  // ⭐⭐ FIXED: Proper string array generation
  generateStringArray(astNode, context, visitor) {
    const name = astNode.name;
    let value = '';
    
    console.log(`DEBUG generateStringArray: Generating String[] ${name}`, astNode.value);
    
    // ⭐⭐ FIXED: Handle both value structures
    let elements = [];
    
    // Case 1: Direct array_initializer with elements
    if (astNode.value && astNode.value.type === 'array_initializer' && astNode.value.value && astNode.value.value.elements) {
      elements = astNode.value.value.elements;
    }
    // Case 2: Elements directly in arrayInitializer property
    else if (astNode.arrayInitializer && astNode.arrayInitializer.elements) {
      elements = astNode.arrayInitializer.elements;
    }
    // Case 3: Initializer list directly
    else if (astNode.value && astNode.value.type === 'initializer_list' && astNode.value.elements) {
      elements = astNode.value.elements;
    }
    // Case 4: Value has elements directly
    else if (astNode.value && astNode.value.elements) {
      elements = astNode.value.elements;
    }
    
    console.log(`DEBUG generateStringArray: Found ${elements.length} elements:`, elements);
    
    if (elements.length > 0) {
      const stringElements = elements.map(el => {
        if (el.type === 'string_literal') {
          return el.value;
        } else if (el.type === 'literal') {
          // Add quotes if not already quoted
          let val = el.value;
          if (!val.startsWith('"') && !val.endsWith('"')) {
            val = `"${val}"`;
          }
          return val;
        } else if (el.type === 'identifier') {
          return el.name;
        }
        return '""';
      }).join(', ');
      
      value = ` = { ${stringElements} }`;
    } else if (astNode.value && astNode.value.value) {
      // Handle simple string value
      const val = astNode.value.value;
      if (typeof val === 'string') {
        if (!val.startsWith('"') && !val.endsWith('"')) {
          value = ` = "${val}"`;
        } else {
          value = ` = ${val}`;
        }
      }
    }
    
    return `String[] ${name}${value};`;
  }

  // ⭐⭐ FIXED: Better array initializer generation
  generateArrayInitializer(initializer, visitor, javaType) {
    if (!initializer) {
      // For multi-dimensional arrays, return appropriate empty array
      if (javaType.endsWith('[][]')) {
        return '{}';
      }
      return '{}';
    }
    
    console.log(`DEBUG generateArrayInitializer: Processing initializer type: ${initializer.type}, javaType: ${javaType}`);
    console.log(`DEBUG generateArrayInitializer: Initializer structure:`, initializer);
    
    if (initializer.type === 'initializer_list') {
      const elements = initializer.elements || [];
      const javaElements = [];
      
      // Check if this is a multi-dimensional array
      const isMultiDim = elements.length > 0 && 
                         (elements[0].type === 'initializer_list' || 
                          elements[0].type === 'array_initializer' ||
                          (elements[0].value && elements[0].value.type === 'initializer_list'));
      
      console.log(`DEBUG generateArrayInitializer: Found ${elements.length} elements, isMultiDim: ${isMultiDim}`);
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        
        if (element.type === 'literal') {
          javaElements.push(element.value);
        } else if (element.type === 'char_literal') {
          let val = element.value;
          if (val.startsWith("'") && val.endsWith("'")) {
            val = val.substring(1, val.length - 1);
          }
          javaElements.push(`'${val}'`);
        } else if (element.type === 'string_literal') {
          let val = element.value;
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          }
          
          // For string arrays
          if (javaType === 'String[]') {
            javaElements.push(`"${val}"`);
          } else {
            javaElements.push(`"${val}"`);
          }
        } else if (element.type === 'initializer_list' || element.type === 'array_initializer') {
          // Recursive call for nested arrays
          // Remove one dimension from javaType for nested arrays
          let nestedType = javaType;
          if (javaType.endsWith('[]')) {
            nestedType = javaType.substring(0, javaType.length - 2);
          } else if (javaType.endsWith('[][]')) {
            nestedType = javaType.substring(0, javaType.length - 4) + '[]';
          }
          
          const nestedInitializer = element.type === 'array_initializer' ? element.value : element;
          javaElements.push(this.generateArrayInitializer(nestedInitializer, visitor, nestedType));
        } else if (element.type === 'array_initializer') {
          // Handle array_initializer type
          const nestedInitializer = element.value || element;
          let nestedType = javaType;
          if (javaType.endsWith('[]')) {
            nestedType = javaType.substring(0, javaType.length - 2);
          }
          javaElements.push(this.generateArrayInitializer(nestedInitializer, visitor, nestedType));
        }
      }
      
      // ⭐⭐ FIXED: Better syntax selection
      // For multi-dimensional arrays, use nested braces
      if (isMultiDim) {
        if (javaElements.length > 0) {
          return `{ ${javaElements.join(', ')} }`;
        } else {
          // Return empty multi-dimensional array
          const dimensions = (javaType.match(/\[\]/g) || []).length;
          if (dimensions === 2) {
            return '{}';
          }
        }
      }
      // For String arrays
      else if (javaType === 'String[]') {
        if (javaElements.length > 0) {
          return `{ ${javaElements.join(', ')} }`;
        } else {
          return '{}';
        }
      }
      // For char arrays - must use new char[] syntax in Java
      else if (javaType === 'char[]') {
        if (javaElements.length > 0) {
          return `new char[] { ${javaElements.join(', ')} }`;
        } else {
          return 'new char[] {}';
        }
      }
      // For int arrays with values
      else if (javaType === 'int[]' && javaElements.length > 0) {
        return `{ ${javaElements.join(', ')} }`;
      }
      // For int[][] arrays
      else if (javaType === 'int[][]') {
        if (javaElements.length > 0) {
          return `{ ${javaElements.join(', ')} }`;
        } else {
          return '{}';
        }
      }
      // Default for other types
      else if (javaElements.length > 0) {
        return `new ${javaType} { ${javaElements.join(', ')} }`;
      }
      // Empty array
      else {
        return '{}';
      }
    }
    
    // Handle array_initializer type directly
    if (initializer.type === 'array_initializer') {
      return this.generateArrayInitializer(initializer.value, visitor, javaType);
    }
    
    return '{}';
  }

  generateVariableWithTernary(astNode, context, visitor) {
    const javaType = this.mapCTypeToJava(astNode.data_type, astNode.value);
    const name = astNode.name;
    
    // Use the ternary generator if available
    if (visitor.generators?.ternary) {
      const ternaryGen = visitor.generators.ternary;
      let ternaryCode = '';
      
      if (typeof ternaryGen === 'function') {
        ternaryCode = ternaryGen(astNode.value, context, visitor);
      } else if (ternaryGen.generate && typeof ternaryGen.generate === 'function') {
        ternaryCode = ternaryGen.generate(astNode.value, context, visitor);
      } else if (ternaryGen.default && ternaryGen.default.generate && typeof ternaryGen.default.generate === 'function') {
        ternaryCode = ternaryGen.default.generate(astNode.value, context, visitor);
      }
      
      if (ternaryCode) {
        return `${javaType} ${name} = ${ternaryCode};`;
      }
    }
    
    // Fallback: manually generate ternary
    const condition = this.generateExpression(astNode.value.condition, visitor);
    const thenValue = this.generateExpression(astNode.value.thenValue, visitor);
    const elseValue = this.generateExpression(astNode.value.elseValue, visitor);
    
    return `${javaType} ${name} = (${condition}) ? ${thenValue} : ${elseValue};`;
  }

  generateExpression(expr, visitor) {
    if (!expr) return '';
    
    // Use the operators generator
    if (visitor.generators?.operators) {
      const gen = visitor.generators.operators;
      let generated = '';
      
      if (typeof gen === 'function') {
        generated = gen(expr, {}, visitor);
      } else if (gen.generate && typeof gen.generate === 'function') {
        generated = gen.generate(expr, {}, visitor);
      } else if (gen.default && gen.default.generate && typeof gen.default.generate === 'function') {
        generated = gen.default.generate(expr, {}, visitor);
      }
      
      if (generated) {
        return generated;
      }
    }
    
    // Handle basic types
    if (expr.type === 'literal') {
      if (expr.data_type === 'String') {
        return `"${expr.value}"`;
      }
      return expr.value.toString();
    }
    
    if (expr.type === 'identifier') {
      return expr.name || '';
    }
    
    if (expr.type === 'binary_expression' || 
        expr.type === 'comparison_expression' ||
        expr.type === 'logical_expression') {
      
      const left = this.generateExpression(expr.left, visitor);
      const right = this.generateExpression(expr.right, visitor);
      const operator = expr.operator || '';
      
      return `(${left} ${operator} ${right})`;
    }
    
    return expr.value || expr.name || '';
  }

  isCBooleanVariable(astNode, context) {
    // Only convert to boolean if explicitly declared as bool/_Bool
    if (astNode.data_type === 'bool' || astNode.data_type === '_Bool') {
      return true;
    }
    
    // Or if it has a boolean-like name AND is int with 0/1 value
    const booleanNames = ['flag', 'status', 'enabled', 'disabled', 'valid', 'found', 
                         'success', 'ok', 'ready', 'available', 'is_valid', 'has_value'];
    
    const name = astNode.name.toLowerCase();
    const isBooleanName = booleanNames.some(boolName => 
      name === boolName || 
      name.startsWith('is') || 
      name.startsWith('has') || 
      name.startsWith('can'));
    
    if (isBooleanName && astNode.data_type === 'int' && astNode.value) {
      const value = astNode.value.value;
      return value === '0' || value === '1' || value === 0 || value === 1;
    }
    
    return false;
  }

  // ⭐⭐ FIXED: Better type mapping with value detection
  mapCTypeToJava(cType, value) {
    if (!cType) return 'Object';
    
    cType = cType.trim();
    
    console.log(`DEBUG mapCTypeToJava: Processing "${cType}" with value:`, value?.type);
    
    // Handle pointer arrays (char* fruits[])
    if ((cType.includes('char*') || cType.includes('char *')) && cType.includes('[]')) {
      return 'String[]';
    }
    
    // Handle char pointer (string)
    if (cType === 'char*' || cType === 'char *') {
      return 'String';
    }
    
    // Handle char arrays (char[])
    if (cType === 'char[]' || cType === 'char []') {
      // If it's a string literal, use String instead
      if (value && (value.type === 'string_literal' || 
                   (value.type === 'array_initializer' && value.value && 
                    value.value.elements && value.value.elements.some(el => el.type === 'string_literal')))) {
        return 'String';
      }
      return 'char[]';
    }
    
    // Handle multi-dimensional arrays like "int[][3]" or "int[3][3]"
    if (cType.match(/\[\d*\]\[\d*\]/)) {
      const baseType = cType.replace(/\[\d*\]\[\d*\]/g, '').trim();
      const javaBaseType = this.mapSimpleCTypeToJava(baseType);
      return `${javaBaseType}[][]`;
    }
    
    // Handle array types
    if (cType.includes('[]')) {
      const baseType = cType.replace(/\[\]/g, '').trim();
      const javaBaseType = this.mapSimpleCTypeToJava(baseType);
      
      // Special handling for char arrays
      if (baseType.includes('char') || baseType === 'char') {
        // If initialized with string literal, use String
        if (value && (value.type === 'string_literal' || 
                     (value.type === 'array_initializer' && value.value && 
                      value.value.elements && value.value.elements.some(el => el.type === 'string_literal')))) {
          return 'String';
        }
        return 'char[]';
      }
      
      // Count array dimensions
      const dimCount = (cType.match(/\[\]/g) || []).length;
      if (dimCount === 2) {
        return `${javaBaseType}[][]`;
      }
      
      return `${javaBaseType}[]`;
    }
    
    // Handle simple types
    return this.mapSimpleCTypeToJava(cType);
  }

  mapSimpleCTypeToJava(cType) {
    if (!cType) return 'Object';
    
    cType = cType.trim().toLowerCase();
    
    const typeMap = {
      'int': 'int',
      'float': 'float',
      'double': 'double',
      'char': 'char',
      'string': 'String',
      'void': 'void',
      'short': 'short',
      'long': 'long',
      'bool': 'boolean',
      '_bool': 'boolean',
      'boolean': 'boolean',
      'long double': 'double',
      'long long': 'long',
      'unsigned': 'int',
      'signed': 'int',
      'unsigned int': 'int',
      'signed int': 'int',
      'unsigned short': 'short',
      'signed short': 'short',
      'unsigned long': 'long',
      'signed long': 'long',
      'char*': 'String',
      'char *': 'String'
    };
    
    // Check for exact match
    if (typeMap[cType]) {
      return typeMap[cType];
    }
    
    // Handle variations
    if (cType.startsWith('unsigned')) {
      return 'int';
    }
    
    if (cType.startsWith('signed')) {
      return 'int';
    }
    
    // Handle long variations
    if (cType.includes('long') && cType.includes('double')) {
      return 'double';
    }
    
    if (cType.includes('long') && cType.includes('int')) {
      return 'long';
    }
    
    return 'Object';
  }

  generateValue(valueNode, cDataType, javaType, visitor) {
    if (!valueNode) return '';
    
    console.log(`DEBUG generateValue: type=${valueNode.type}, javaType=${javaType}, value=`, valueNode);
    
    // Handle array initializers
    if (valueNode.type === 'array_initializer') {
      return this.generateArrayInitializer(valueNode.value, visitor, javaType);
    }
    
    // Handle initializer_list directly
    if (valueNode.type === 'initializer_list') {
      return this.generateArrayInitializer(valueNode, visitor, javaType);
    }
    
    if (valueNode.type === 'literal') {
      let value = valueNode.value;
      
      // Handle String type
      if (javaType === 'String') {
        if (typeof value === 'string') {
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }
          return `"${value}"`;
        }
        return `"${value}"`;
      }
      
      // Handle char literals
      if (javaType === 'char') {
        if (typeof value === 'string' && value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        return `'${value}'`;
      }
      
      // Handle boolean
      if (javaType === 'boolean') {
        if (value === 'true' || value === true || value === '1') {
          return 'true';
        }
        if (value === 'false' || value === false || value === '0') {
          return 'false';
        }
        return value.toString();
      }
      
      // Handle float/double suffixes
      if (javaType === 'float' && typeof value === 'string' && value.includes('.') && !value.endsWith('f')) {
        return value + 'f';
      }
      
      if (javaType === 'long' && typeof value === 'string' && !isNaN(value) && !value.includes('.') && !value.endsWith('L')) {
        return value + 'L';
      }
      
      return value.toString();
    }
    
    if (valueNode.type === 'identifier') {
      return valueNode.name;
    }
    
    if (valueNode.type === 'binary_expression' || 
        valueNode.type === 'comparison_expression' ||
        valueNode.type === 'logical_expression') {
      return this.generateExpression(valueNode, visitor);
    }
    
    if (valueNode.type === 'string_literal') {
      let value = valueNode.value;
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      
      // For char[] type, convert string to char array
      if (javaType === 'char[]') {
        const chars = value.split('').map(c => `'${c}'`).join(', ');
        return `new char[] { ${chars} }`;
      }
      
      return `"${value}"`;
    }
    
    return valueNode.value || '';
  }
  
  // ⭐⭐ NEW: Generate array assignment (for array[0] = 10;)
  generateArrayAssignment(node, context, visitor) {
    const indent = ' '.repeat(context.indentLevel * 4);
    const { arrayName, index, value } = node;
    
    // Generate the array index
    const indexStr = Array.isArray(index) ? 
      `[${index.join('][')}]` : 
      `[${index}]`;
    
    // Generate the value
    const valueStr = this.generateValue(value, null, null, visitor);
    
    return `${indent}${arrayName}${indexStr} = ${valueStr};`;
  }
}

export default {
  generate: function(node, context, visitor) {
    const generator = new CVariableGenerator();
    return generator.generate(node, context, visitor);
  }
};