import { VariableDeclaration } from '../../../core/ast-nodes.js';

export class JavaVariablesGenerator {
  constructor() {
    console.log('✅ C JavaVariablesGenerator initialized');
  }

  canGenerate(astNode) {
    return astNode.type === 'variable_declaration';
  }

  generate(astNode, context) {
    if (!this.canGenerate(astNode)) {
      console.warn(`JavaVariablesGenerator cannot generate node type: ${astNode.type}`);
      return '';
    }

    console.log(`JavaVariablesGenerator processing: ${astNode.data_type} ${astNode.name}`);
    console.log('AST Node value:', astNode.value);

    // Check if this is an array declaration
    if (this.isArrayDeclaration(astNode)) {
      console.log('Detected array declaration');
      return this.generateArrayDeclaration(astNode, context);
    }

    // Map Java types to modern C types with stdbool.h support
    const typeMap = {
      'byte': 'signed char',           // 8-bit integer
      'short': 'short',                // 16-bit integer
      'int': 'int',                    // 32-bit integer
      'long': 'long long',             // 64-bit integer (use long long for 64-bit)
      'float': 'float',                // 32-bit float
      'double': 'double',              // 64-bit float
      'char': 'char',                  // character
      'boolean': 'bool',               // Use bool from stdbool.h
      'String': 'char*',               // String
      'void': 'void'
    };

    let cType = typeMap[astNode.data_type] || 'int';
    let varName = astNode.name;
    
    // Track boolean usage for including stdbool.h
    if (astNode.data_type === 'boolean') {
      if (context && context.translator && context.translator.trackBooleanUsage) {
        console.log('✓ Boolean usage detected - tracking for stdbool.h');
        context.translator.trackBooleanUsage();
      }
    }
    
    // Avoid naming conflict with C keyword
    if (varName === 'bool') {
      varName = 'bool_val';
    }
    
    let defaultValue = '';
    
    // Handle initialization
    if (astNode.value) {
      const valueStr = this.extractValue(astNode.value, astNode.data_type);
      console.log('Extracted value string:', valueStr);
      if (valueStr !== null && valueStr !== undefined && valueStr !== '') {
        defaultValue = ` = ${valueStr}`;
      }
    } else {
      // Set default values for C
      if (cType === 'char*') {
        defaultValue = ' = ""';
      } else if (cType === 'int' || cType === 'short' || cType === 'signed char') {
        defaultValue = ' = 0';
      } else if (cType === 'long long') {
        defaultValue = ' = 0LL';
      } else if (cType === 'float' || cType === 'double') {
        defaultValue = ' = 0.0';
      } else if (cType === 'char') {
        defaultValue = " = '\\0'";
      } else if (cType === 'bool') {
        defaultValue = ' = false';
      }
    }

    // Add to context with proper structure
    if (context && context.addSymbol) {
      const symbolInfo = {
        cType: cType,
        javaType: astNode.data_type,
        varName: varName  // Store the actual variable name used
      };
      console.log(`Adding symbol to context: ${astNode.name} -> ${varName} =`, symbolInfo);
      context.addSymbol(astNode.name, symbolInfo);
    }

    const result = `${cType} ${varName}${defaultValue};`;
    console.log('Generated variable declaration:', result);
    return result;
  }

  isArrayDeclaration(astNode) {
  console.log('🚨🚨🚨 CHECKING IF ARRAY DECLARATION 🚨🚨🚨');
  console.log('astNode.data_type:', astNode.data_type);
  console.log('astNode.value.type:', astNode.value?.type);
  console.log('astNode.value.elements:', astNode.value?.elements);
  
  // Check if data_type contains [] or value is an array
  if (!astNode.data_type) {
    console.log('❌ No data_type');
    return false;
  }
  
  if (astNode.data_type.includes('[]')) {
    console.log('✅ Array detected by data_type:', astNode.data_type);
    return true;
  }
  
  // Check if value is an array literal
  if (astNode.value && typeof astNode.value === 'object') {
    if (astNode.value.type === 'array_literal') {
      console.log('✅ Array detected by value.type: array_literal');
      return true;
    }
    if (astNode.value.elements && Array.isArray(astNode.value.elements)) {
      console.log('✅ Array detected by value.elements array');
      return true;
    }
  }
  
  console.log('❌ Not an array');
  return false;
}

  generateArrayDeclaration(astNode, context) {
  console.log('Generating array declaration for:', astNode);
  
  // Extract element type from Java type (e.g., "String[]" -> "String")
  let elementType = 'int';
  let javaElementType = 'int';
  
  if (astNode.data_type && astNode.data_type.includes('[]')) {
    javaElementType = astNode.data_type.replace('[]', '');
    elementType = this.mapJavaTypeToC(javaElementType);
  }
  
  const arrayName = astNode.name || 'arr';
  
  // Extract array values
  let arraySize = 0;
  let initializer = '';
  let declaration = ''; // DECLARE HERE at function scope
  
  if (astNode.value && astNode.value.type === 'array_literal' && astNode.value.elements) {
    const elements = astNode.value.elements || [];
    arraySize = elements.length;
    
    // Format array initializer based on element type
    const elementValues = elements.map(element => {
      if (element.type === 'literal') {
        if (javaElementType === 'String' || element.data_type === 'string' || element.data_type === 'Object') {
          // String literal
          return `"${element.value}"`;
        } else if (element.data_type === 'int') {
          // Integer literal
          return element.value;
        } else if (element.data_type === 'float') {
          // Float literal
          return element.value + 'f';
        } else if (element.data_type === 'double') {
          // Double literal
          return element.value;
        } else if (element.data_type === 'char') {
          // Character literal
          return `'${element.value}'`;
        } else if (element.data_type === 'boolean') {
          // Boolean literal
          return element.value === true || element.value === 'true' ? 'true' : 'false';
        }
      }
      return '0';
    }).join(', ');
    
    // For string arrays in C, we need to use char* array
    if (javaElementType === 'String' || elementType === 'char*') {
      declaration = `char* ${arrayName}[] = {${elementValues}};`;
    } else {
      declaration = `${elementType} ${arrayName}[${arraySize}] = {${elementValues}};`;
    }
  } else {
    // No initializer - just declare
    arraySize = 10; // Default size
    if (javaElementType === 'String' || elementType === 'char*') {
      declaration = `char* ${arrayName}[${arraySize}];`;
    } else {
      declaration = `${elementType} ${arrayName}[${arraySize}];`;
    }
  }
  
  // Store array info in context for enhanced for loops
  if (context && context.addSymbol) {
    const symbolInfo = {
      cType: elementType === 'char*' ? 'char*[]' : `${elementType}[]`,
      javaType: astNode.data_type,
      varName: arrayName,
      arraySize: arraySize,
      elementType: elementType,
      isArray: true
    };
    
    if (astNode.value && astNode.value.elements) {
      symbolInfo.values = astNode.value.elements.map(el => el.value);
    }
    
    console.log(`Adding array symbol to context: ${arrayName} ->`, symbolInfo);
    context.addSymbol(arrayName, symbolInfo);
  }
  
  console.log('Generated array declaration:', declaration);
  return declaration;
}

  extractValue(value, javaType) {
    if (!value) return '';
    
    console.log('Extracting value:', value, 'type:', typeof value, 'javaType:', javaType);
    
    // Handle object values from parser
    if (typeof value === 'object' && value !== null) {
      if (value.type === 'literal') {
        // Extract the actual value
        let actualValue = value.value;
        
        // Format based on Java type
        if (javaType === 'String') {
          return `"${String(actualValue).replace(/"/g, '')}"`;
        } else if (javaType === 'char') {
          const charStr = String(actualValue);
          return charStr.length === 1 ? `'${charStr}'` : "'\\0'";
        } else if (javaType === 'boolean') {
          // Use true/false for stdbool.h
          return actualValue === true || actualValue === 'true' ? 'true' : 'false';
        } else if (javaType === 'float') {
          const val = String(actualValue);
          return val.endsWith('f') || val.endsWith('F') ? val : val + 'f';
        } else if (javaType === 'long') {
          const val = String(actualValue);
          // Use LL suffix for long long
          const numVal = val.replace(/[Ll]$/g, '');
          return numVal + 'LL';
        } else if (javaType === 'byte') {
          const num = parseInt(actualValue);
          return String(num);
        } else {
          // int, double, short, etc.
          return String(actualValue);
        }
      } else if (value.type === 'identifier') {
        return value.name || 'undefined';
      } else if (value.type === 'array_literal') {
        // Handle array literals - should be handled by generateArrayDeclaration
        return '/* array initializer - handled separately */';
      }
    }
    
    // Handle primitive values
    if (javaType === 'String') {
      return `"${String(value).replace(/"/g, '')}"`;
    } else if (javaType === 'char') {
      const charStr = String(value);
      return charStr.length === 1 ? `'${charStr}'` : "'\\0'";
    } else if (javaType === 'boolean') {
      // Use true/false for stdbool.h
      return value === true || value === 'true' ? 'true' : 'false';
    } else if (javaType === 'long') {
      const val = String(value);
      const numVal = val.replace(/[Ll]$/g, '');
      return numVal + 'LL';
    }
    
    return String(value);
  }

  mapJavaTypeToC(javaType) {
    const typeMap = {
      'int': 'int',
      'float': 'float',
      'double': 'double',
      'char': 'char',
      'String': 'char*',
      'string': 'char*',
      'byte': 'signed char',
      'short': 'short',
      'long': 'long long',
      'boolean': 'bool'
    };
    
    return typeMap[javaType] || 'int';
  }
}