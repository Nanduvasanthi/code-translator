import { ArrayDeclaration } from '../../../core/ast-nodes.js';

export class JavaArraysGenerator {
  constructor() {
    console.log('✅ C JavaArraysGenerator initialized');
  }

  canGenerate(astNode) {
    return astNode.type === 'array_declaration' ||
           astNode.type === 'array_access' ||
           astNode.type === 'array_initialization';
  }

  generate(astNode, context) {
    if (!this.canGenerate(astNode)) {
      console.warn(`JavaArraysGenerator cannot generate node type: ${astNode.type}`);
      return '';
    }

    console.log(`JavaArraysGenerator processing: ${astNode.type}`);
    console.log('Array AST:', JSON.stringify(astNode, null, 2));

    switch (astNode.type) {
      case 'array_declaration':
        return this.generateArrayDeclaration(astNode, context);
      case 'array_access':
        return this.generateArrayAccess(astNode, context);
      case 'array_initialization':
        return this.generateArrayInitialization(astNode, context);
      default:
        return '';
    }
  }

  generateArrayDeclaration(astNode, context) {
    const elementType = this.mapJavaTypeToC(astNode.element_type || 'int');
    const arrayName = astNode.name || 'arr';
    
    // Check if we have initial values
    if (astNode.values && Array.isArray(astNode.values) && astNode.values.length > 0) {
      return this.generateArrayWithInitialValues(astNode, elementType, arrayName, context);
    }
    
    // Empty array declaration
    const size = '10'; // Default size
    return `${elementType} ${arrayName}[${size}];`;
  }

  generateArrayWithInitialValues(astNode, elementType, arrayName, context) {
  console.log('Generating array with initial values:', astNode.values);
  
  // Check if this is a method call like numbers.clone()
  if (astNode.values.length === 1 && astNode.values[0] && astNode.values[0].type === 'method_call') {
    const methodCall = astNode.values[0];
    console.log('Found method call in array initializer:', methodCall);
    
    if (methodCall.method === 'clone') {
      // Handle array clone operation
      const sourceArray = methodCall.object?.name || 'src';
      console.log(`Cloning array ${sourceArray} to ${arrayName}`);
      
      // Generate array copy code
      return this.generateArrayClone(arrayName, sourceArray, elementType, context);
    }
  }
  
  // Format the values properly - handle multi-dimensional arrays
  const values = astNode.values.map(val => {
    if (typeof val === 'object') {
      if (val.type === 'literal') {
        // String literals need quotes
        if (val.data_type === 'string' || elementType === 'char*') {
          return `"${val.value || ''}"`;
        }
        // Numeric literals
        return val.value || '0';
      } else if (val.type === 'identifier') {
        return val.name;
      } else if (val.type === 'array') {
        // Handle nested array (multi-dimensional array)
        console.log('Found nested array in initializer');
        if (val.values && Array.isArray(val.values)) {
          // Recursively process nested array values
          const nestedValues = val.values.map(nestedVal => {
            if (typeof nestedVal === 'object') {
              if (nestedVal.type === 'literal') {
                return nestedVal.value || '0';
              } else if (nestedVal.type === 'array') {
                // Handle deeper nesting (3D arrays, etc.)
                return this.generateNestedArrayValues(nestedVal);
              }
            }
            return String(nestedVal);
          }).join(', ');
          
          return `{${nestedValues}}`;
        }
      } else if (val.type === 'method_call') {
        // Handle method calls in array initializers
        console.log('Found method call in array values:', val);
        // For now, return placeholder
        return `/* TODO: ${val.method}() */`;
      }
    }
    return String(val);
  }).join(', ');
  
  // Determine if this is a multi-dimensional array
  const isMultiDimensional = astNode.values.some(val => 
    val && typeof val === 'object' && val.type === 'array'
  );
  
  // For multi-dimensional arrays, we need to specify dimensions in C
  let declaration = '';
  if (isMultiDimensional) {
    // For 2D array: int matrix[3][3] = {{1,2,3}, {4,5,6}, {7,8,9}};
    const outerSize = astNode.values.length;
    const innerSize = astNode.values[0]?.values?.length || 0;
    
    if (outerSize > 0 && innerSize > 0) {
      declaration = `${elementType} ${arrayName}[${outerSize}][${innerSize}] = {${values}};`;
    } else {
      declaration = `${elementType} ${arrayName}[] = {${values}};`;
    }
  } else {
    // Regular 1D array
    declaration = `${elementType} ${arrayName}[] = {${values}};`;
  }
  
  // ✅ FIXED: Add proper symbol info to context
  if (context && context.addSymbol) {
    console.log(`📝 [ArraysContext] Adding variable: ${arrayName} (${elementType}[])`);
    
    const symbolInfo = {
      cType: `${elementType}[]`,
      javaType: astNode.element_type || 'String[]',
      varName: arrayName,
      elementType: elementType,
      values: astNode.values,
      arraySize: astNode.values.length
    };
    
    // Mark as multi-dimensional if needed
    if (isMultiDimensional) {
      symbolInfo.isMultiDimensional = true;
      symbolInfo.dimensions = 2; // For now, assume 2D
      symbolInfo.outerSize = astNode.values.length;
      symbolInfo.innerSize = astNode.values[0]?.values?.length || 0;
    }
    
    context.addSymbol(arrayName, symbolInfo);
  }
  
  return declaration;
}

// Helper method to generate array clone code
generateArrayClone(targetArray, sourceArray, elementType, context) {
  // In C, we need to manually copy arrays
  const sizeVar = `${sourceArray}_length`;
  
  let code = '';
  
  // First, get the size of the source array
  code += `int ${sizeVar} = sizeof(${sourceArray}) / sizeof(${sourceArray}[0]);\n`;
  code += `    ${elementType} ${targetArray}[${sizeVar}];\n`;
  code += `    for (int i = 0; i < ${sizeVar}; i++) {\n`;
  code += `        ${targetArray}[i] = ${sourceArray}[i];\n`;
  code += `    }`;
  
  // Add symbol info for the cloned array
  if (context && context.addSymbol) {
    context.addSymbol(targetArray, {
      cType: `${elementType}[]`,
      javaType: 'Object', // From the parser
      varName: targetArray,
      elementType: elementType,
      arraySize: -1, // Dynamic size
      isCloned: true,
      sourceArray: sourceArray
    });
  }
  
  return code;
}

// Helper method for deeply nested arrays
generateNestedArrayValues(arrayNode) {
  if (!arrayNode.values || !Array.isArray(arrayNode.values)) {
    return '{}';
  }
  
  const values = arrayNode.values.map(val => {
    if (typeof val === 'object') {
      if (val.type === 'literal') {
        return val.value || '0';
      } else if (val.type === 'array') {
        return this.generateNestedArrayValues(val);
      }
    }
    return String(val);
  }).join(', ');
  
  return `{${values}}`;
}

  generateArrayInitialization(astNode, context) {
    const elementType = this.mapJavaTypeToC(astNode.element_type || 'int');
    const arrayName = astNode.name || 'arr';
    
    if (!astNode.values || !Array.isArray(astNode.values) || astNode.values.length === 0) {
      return `${elementType} ${arrayName}[] = {};`;
    }
    
    const values = astNode.values.map(val => {
      if (typeof val === 'object' && val.value !== undefined) {
        return val.value;
      }
      return val;
    }).join(', ');
    
    return `${elementType} ${arrayName}[] = {${values}};`;
  }

  generateArrayAccess(astNode, context) {
  console.log('Generating array access:', astNode);
  
  // Handle nested array access (like matrix[1][2])
  // Check if array property is itself an array access object
  let arrayExpr = '';
  if (astNode.array && typeof astNode.array === 'object') {
    // Recursively generate the inner array access
    if (astNode.array.type === 'array_access' || astNode.array.type === 'subscript_expression') {
      console.log('Found nested array access in array property');
      arrayExpr = this.generateArrayAccess(astNode.array, context);
    } else if (astNode.array.type === 'identifier') {
      arrayExpr = astNode.array.name || 'arr';
    } else {
      // Try to generate it as an expression
      const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
      if (operatorsGenerator && operatorsGenerator.generate) {
        arrayExpr = operatorsGenerator.generate(astNode.array, context);
      } else {
        arrayExpr = this.expressionToString(astNode.array, context);
      }
    }
  } else {
    // Simple array name
    arrayExpr = astNode.array || astNode.array_name || astNode.name || 'arr';
  }
  
  let index = astNode.index || '0';
  
  // Check if index is a complex expression that needs to be generated
  if (index && typeof index === 'object') {
    console.log('Index is object, type:', index.type);
    
    // Handle special cases first
    if (index.type === 'member_expression' || index.type === 'field_access') {
      // Handle cases like numbers.length - 1
      if (index.object === arrayExpr && index.property === 'length') {
        // Convert numbers.length to array size calculation
        const sizeExpr = `sizeof(${arrayExpr}) / sizeof(${arrayExpr}[0])`;
        
        // Check if there's an operator (like - 1)
        if (astNode.index_expression && astNode.index_expression.type === 'binary_expression') {
          const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
          if (operatorsGenerator && operatorsGenerator.generate) {
            // Create a binary expression with the size as left operand
            const exprToGenerate = {
              ...astNode.index_expression,
              left: { type: 'identifier', name: sizeExpr } // Use size expression as left
            };
            index = operatorsGenerator.generate(exprToGenerate, context);
          } else {
            index = `${sizeExpr} - 1`; // Default fallback
          }
        } else {
          index = sizeExpr;
        }
      } else {
        // Get operators generator to handle the expression
        const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
        if (operatorsGenerator && operatorsGenerator.generate) {
          index = operatorsGenerator.generate(index, context);
        } else {
          index = this.expressionToString(index, context);
        }
      }
    } 
    // Handle binary expressions
    else if (index.type === 'binary_expression' || 
             index.type === 'arithmetic_expression') {
      const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
      if (operatorsGenerator && operatorsGenerator.generate) {
        index = operatorsGenerator.generate(index, context);
      } else {
        index = this.expressionToString(index, context);
      }
    }
    // Handle parenthesized expressions
    else if (index.type === 'parenthesized_expression') {
      if (index.expression) {
        // Recursively handle the inner expression
        return this.generateArrayAccess({ 
          ...astNode, 
          index: index.expression 
        }, context);
      }
    }
    // Handle identifiers
    else if (index.type === 'identifier') {
      index = index.name || '0';
    }
    // Handle literals
    else if (index.type === 'literal') {
      index = index.value || '0';
    }
    // Default: try to convert to string
    else {
      index = this.expressionToString(index, context);
    }
  }
  
  const result = `${arrayExpr}[${index}]`;
  console.log(`Generated array access: ${result}`);
  return result;
}

// Helper method to convert expression to string
expressionToString(expr, context) {
  if (!expr) return '0';
  
  if (typeof expr === 'string') {
    return expr;
  }
  
  if (typeof expr === 'number') {
    return String(expr);
  }
  
  if (expr.type === 'binary_expression') {
    const left = this.expressionToString(expr.left, context);
    const right = this.expressionToString(expr.right, context);
    const operator = expr.operator || '+';
    return `(${left} ${operator} ${right})`;
  }
  
  if (expr.type === 'identifier') {
    return expr.name || 'unknown';
  }
  
  if (expr.type === 'literal') {
    return expr.value || '0';
  }
  
  if (expr.type === 'member_expression' || expr.type === 'field_access') {
    const object = expr.object || expr.name || 'obj';
    const property = expr.property || 'prop';
    return `${object}.${property}`;
  }
  
  // Default fallback
  return '0';
}

  mapJavaTypeToC(javaType) {
    // Remove [] if present
    const baseType = javaType.replace('[]', '');
    
    const typeMap = {
      'int': 'int',
      'float': 'float',
      'double': 'double',
      'char': 'char',
      'byte': 'char',
      'short': 'short',
      'long': 'long',
      'boolean': 'int',
      'String': 'char*',
      'string': 'char*'
    };
    
    return typeMap[baseType] || 'int';
  }
}