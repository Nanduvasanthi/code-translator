import { PrintStatement } from '../../../core/ast-nodes.js';

export class JavaPrintGenerator {
  constructor() {
    console.log('✅ C JavaPrintGenerator initialized');
  }

  canGenerate(astNode) {
    return astNode.type === 'print_statement';
  }

  generate(astNode, context) {
  if (!this.canGenerate(astNode)) {
    console.warn(`JavaPrintGenerator cannot generate node type: ${astNode.type}`);
    return '';
  }

  console.log(`JavaPrintGenerator processing print statement`);
  console.log('Arguments:', astNode.arguments);

  let formatString = '';
  let formatArgs = [];
  let hasFormatArgs = false;

  const args = Array.isArray(astNode.arguments) ? astNode.arguments : [astNode.arguments];
  
  args.forEach((arg, index) => {
    console.log(`Processing argument ${index}:`, arg);
    
    if (!arg) return;
    
    if (typeof arg === 'string') {
      formatString += arg.replace(/"/g, '');
    } else if (arg && typeof arg === 'object') {
      if (arg.type === 'string_literal' || (arg.type === 'literal' && arg.literalType === 'string')) {
        const strValue = arg.value || arg.text || '';
        formatString += strValue.replace(/"/g, '');
      } else if (arg.type === 'identifier') {
        hasFormatArgs = true;
        const varName = arg.name || 'unknown';
        
        // Get the actual C variable name (might be renamed)
        let actualVarName = this.getActualVariableName(varName, context);
        let formatSpecifier = this.getFormatSpecifier(varName, context);
        
        formatString += formatSpecifier;
        formatArgs.push(actualVarName);
        console.log(`Added variable "${actualVarName}" with format "${formatSpecifier}"`);
        
      } else if (arg.type === 'literal') {
        hasFormatArgs = true;
        const value = arg.value || '0';
        const dataType = arg.data_type || 'int';
        
        let formatSpecifier = this.getFormatSpecifierForType(dataType);
        
        formatString += formatSpecifier;
        formatArgs.push(this.formatValueForC(value, dataType));
        
      } else if (arg.type === 'array_access' || arg.type === 'subscript_expression') {
        // Handle direct array access like System.out.println(numbers[i]);
        console.log('Processing direct array access in print statement');
        const arrayAccessResult = this.extractFormatParts(arg, context);
        formatString += arrayAccessResult.format;
        if (arrayAccessResult.args.length > 0) {
          hasFormatArgs = true;
          formatArgs.push(...arrayAccessResult.args);
        }
        
      } else if (arg.type === 'binary_expression' || arg.type === 'concatenated_expression') {
        const concatenatedResult = this.handleConcatenatedExpression(arg, context);
        formatString += concatenatedResult.format;
        if (concatenatedResult.args.length > 0) {
          hasFormatArgs = true;
          formatArgs.push(...concatenatedResult.args);
        }
      }
    }
  });

  // Add newline for println
  if (astNode.isNewLine !== false) {
    formatString += '\\n';
  }

  console.log(`Final format string: "${formatString}"`);
  console.log(`Format args: [${formatArgs.join(', ')}]`);

  if (hasFormatArgs && formatArgs.length > 0) {
    return `printf("${formatString}", ${formatArgs.join(', ')});`;
  } else {
    return `printf("${formatString}");`;
  }
}

  getActualVariableName(varName, context) {
    if (context && context.getSymbol) {
      const symbolInfo = context.getSymbol(varName);
      console.log(`Looking up actual variable name for "${varName}":`, symbolInfo);
      
      if (symbolInfo) {
        // FIXED: Handle both structure types
        if (symbolInfo.varName) {
          // Direct structure: { cType: 'bool', javaType: 'boolean', varName: 'bool_val' }
          return symbolInfo.varName;
        } else if (symbolInfo.type && symbolInfo.type.varName) {
          // Nested structure: { type: { cType: 'bool', javaType: 'boolean', varName: 'bool_val' } }
          return symbolInfo.type.varName;
        }
      }
    }
    return varName;
  }

  getFormatSpecifier(varName, context) {
    let formatSpecifier = '%d'; // default for int
    
    if (context && context.getSymbol) {
      const symbolInfo = context.getSymbol(varName);
      console.log(`Looking up symbol "${varName}":`, symbolInfo);
      
      if (symbolInfo) {
        // Get the type information
        let javaType = null;
        let cType = null;
        
        if (symbolInfo.javaType) {
          // Direct structure: { cType: 'bool', javaType: 'boolean', varName: 'bool_val' }
          javaType = symbolInfo.javaType;
          cType = symbolInfo.cType;
          console.log(`Found direct structure: javaType=${javaType}, cType=${cType}`);
        } else if (symbolInfo.type && typeof symbolInfo.type === 'object') {
          // Nested structure: { type: { cType: 'long long', javaType: 'long', varName: 'l' } }
          if (symbolInfo.type.javaType) {
            javaType = symbolInfo.type.javaType;
            cType = symbolInfo.type.cType;
            console.log(`Found nested structure: javaType=${javaType}, cType=${cType}`);
          }
        }
        
        // CRITICAL FIX: Check for String/char* types FIRST
        if (javaType === 'String' || cType === 'char*' || cType === 'char*[]') {
          console.log(`Detected string type for ${varName}, using %s`);
          return '%s';
        }
        
        // Handle integer types
        if (javaType === 'int' || javaType === 'byte' || javaType === 'short' || 
            cType === 'int' || cType === 'signed char' || cType === 'short') {
          console.log(`Detected integer type for ${varName}, using %d`);
          return '%d';
        }
        
        // Handle other types
        if (javaType) {
          return this.getFormatSpecifierForType(javaType);
        } else if (cType) {
          return this.getFormatSpecifierForCType(cType);
        }
      }
    }
    
    console.log(`Using default format specifier %d for ${varName}`);
    return '%d'; // Default to %d for integers
  }

  getFormatSpecifierForType(javaType) {
    console.log(`Getting format specifier for Java type: ${javaType}`);
    switch (javaType) {
      case 'byte':
        return '%d';        // signed char
      case 'short':
        return '%d';        // short
      case 'int':
        return '%d';        // int
      case 'long':
        return '%lld';      // long long needs %lld
      case 'float':
        return '%f';        // float
      case 'double':
        return '%lf';       // double
      case 'char':
        return '%c';        // char
      case 'boolean':
        return '%d';        // bool prints as %d
      case 'String':
        return '%s';        // char*
      default:
        return '%d';       // Default to integer
    }
  }

  getFormatSpecifierForCType(cType) {
    console.log(`Getting format specifier for C type: ${cType}`);
    switch (cType) {
      case 'signed char':
        return '%d';
      case 'short':
        return '%d';
      case 'int':
        return '%d';
      case 'long long':
        return '%lld';      // long long
      case 'float':
        return '%f';
      case 'double':
        return '%lf';
      case 'char':
        return '%c';
      case 'bool':
        return '%d';
      case 'char*':
        return '%s';
      case 'char*[]':
        return '%s';  // Array elements
      default:
        return '%d';
    }
  }

  formatValueForC(value, javaType) {
    if (javaType === 'boolean') {
      return value === true || value === 'true' ? 'true' : 'false';
    } else if (javaType === 'long') {
      const str = String(value);
      return str.replace(/[Ll]$/g, '');
    } else if (javaType === 'float') {
      const str = String(value);
      return str.endsWith('f') || str.endsWith('F') ? str : str + 'f';
    } else {
      return String(value);
    }
  }

  handleConcatenatedExpression(expr, context) {
  const result = { format: '', args: [] };
  
  if (expr.type === 'binary_expression' && expr.operator === '+') {
    // Recursively handle both sides
    const leftResult = this.extractFormatParts(expr.left, context);
    const rightResult = this.extractFormatParts(expr.right, context);
    
    result.format = leftResult.format + rightResult.format;
    result.args = [...leftResult.args, ...rightResult.args];
    
  } else if (expr.type === 'concatenated_expression' && expr.parts) {
    expr.parts.forEach(part => {
      const partResult = this.extractFormatParts(part, context);
      result.format += partResult.format;
      result.args.push(...partResult.args);
    });
  } else {
    // Handle other expression types
    const partResult = this.extractFormatParts(expr, context);
    result.format = partResult.format;
    result.args = partResult.args;
  }
  
  return result;
}


extractFormatParts(expr, context) {
  const result = { format: '', args: [] };
  
  if (!expr) return result;
  
  console.log(`DEBUG extractFormatParts: type=${expr.type}, operator=${expr.operator || 'none'}`);
  
  // Handle string literals
  if (expr.type === 'string_literal' || (expr.type === 'literal' && typeof expr.value === 'string')) {
    const strValue = expr.value || '';
    result.format = strValue.replace(/"/g, '');
    console.log(`DEBUG: String literal -> "${strValue}"`);
  } 
  // Handle identifiers
  else if (expr.type === 'identifier') {
    const varName = expr.name || 'unknown';
    const actualVarName = this.getActualVariableName(varName, context);
    const formatSpecifier = this.getFormatSpecifier(varName, context);
    
    result.format = formatSpecifier;
    result.args.push(actualVarName);
    console.log(`DEBUG: Identifier ${varName} -> ${formatSpecifier} (${actualVarName})`);
  } 
  // Handle array access expressions
  else if (expr.type === 'array_access' || expr.type === 'subscript_expression') {
    console.log('DEBUG: Array access expression:', expr);
    
    // Generate the array access expression
    const formatSpecifier = this.getArrayElementFormatSpecifier(expr.array, context);
    const arrayAccessExpr = this.generateArrayAccessExpression(expr, context);
    
    result.format = formatSpecifier;
    result.args.push(arrayAccessExpr);
    console.log(`DEBUG: Array access -> ${formatSpecifier} (${arrayAccessExpr})`);
  }
  // Handle field access expressions (like array.length)
  else if (expr.type === 'field_access' || expr.type === 'member_expression') {
    console.log('DEBUG: Field access expression:', expr);
    
    const objectName = expr.object?.name || expr.name || 'obj';
    const fieldName = expr.field || expr.property || 'field';
    
    console.log(`DEBUG: Field access ${objectName}.${fieldName}`);
    
    // Special case: array.length
    if (fieldName === 'length') {
      // Check if it's an array by looking up in context
      if (context && context.getSymbol) {
        const symbolInfo = context.getSymbol(objectName);
        if (symbolInfo) {
          // Convert to C array size calculation
          const sizeExpr = `sizeof(${objectName}) / sizeof(${objectName}[0])`;
          result.format = "%d";
          result.args.push(sizeExpr);
          console.log(`DEBUG: Array.length -> %d (${sizeExpr})`);
        } else {
          // Not found in context, use default
          result.format = "%d";
          result.args.push("0");
          console.log(`DEBUG: Object ${objectName} not found in context, using 0`);
        }
      } else {
        result.format = "%d";
        result.args.push("0");
        console.log('DEBUG: No context available for field access');
      }
    } else {
      // Other field accesses (e.g., object.property)
      // For now, just use the field name
      result.format = "%d";
      result.args.push(`${objectName}.${fieldName}`);
      console.log(`DEBUG: Field access -> %d (${objectName}.${fieldName})`);
    }
  }
  // Handle other literals
  else if (expr.type === 'literal') {
    const value = expr.value || '0';
    const dataType = expr.data_type || 'int';
    const formatSpecifier = this.getFormatSpecifierForType(dataType);
    
    result.format = formatSpecifier;
    result.args.push(this.formatValueForC(value, dataType));
    console.log(`DEBUG: Literal ${value} -> ${formatSpecifier}`);
  } 
  // Handle binary expressions with + operator
  else if (expr.type === 'binary_expression' && expr.operator === '+') {
    console.log(`DEBUG: Binary expression with + operator`);
    
    // Check if this is string concatenation or arithmetic
    const leftIsString = this.isStringLiteral(expr.left) || this.isStringExpression(expr.left);
    const rightIsString = this.isStringLiteral(expr.right) || this.isStringExpression(expr.right);
    
    console.log(`DEBUG: leftIsString=${leftIsString}, rightIsString=${rightIsString}`);
    
    if (leftIsString || rightIsString) {
      // String concatenation
      console.log('DEBUG: Detected string concatenation');
      const leftResult = this.extractFormatParts(expr.left, context);
      const rightResult = this.extractFormatParts(expr.right, context);
      
      result.format = leftResult.format + rightResult.format;
      result.args = [...leftResult.args, ...rightResult.args];
    } else {
      // Arithmetic addition - generate expression
      console.log('DEBUG: Detected arithmetic addition');
      
      // Get operators generator from context
      const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
      
      if (operatorsGenerator && operatorsGenerator.generate) {
        const expression = operatorsGenerator.generate(expr, context);
        result.format = "%d";  // Arithmetic result is integer
        result.args.push(expression);
        console.log(`DEBUG: Arithmetic expression -> ${expression}`);
      } else {
        // Fallback: generate expression manually
        const leftStr = this.expressionToString(expr.left, context);
        const rightStr = this.expressionToString(expr.right, context);
        result.format = "%d";
        result.args.push(`(${leftStr} + ${rightStr})`);
      }
    }
  }
  // Handle other arithmetic operators
  else if (expr.type === 'binary_expression' && 
           ['-', '*', '/', '%'].includes(expr.operator)) {
    console.log(`DEBUG: Arithmetic operator: ${expr.operator}`);
    
    // Get operators generator
    const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
    
    if (operatorsGenerator && operatorsGenerator.generate) {
      const expression = operatorsGenerator.generate(expr, context);
      result.format = "%d";
      result.args.push(expression);
      console.log(`DEBUG: Arithmetic expression -> ${expression}`);
    } else {
      // Fallback
      const leftStr = this.expressionToString(expr.left, context);
      const rightStr = this.expressionToString(expr.right, context);
      result.format = "%d";
      result.args.push(`(${leftStr} ${expr.operator} ${rightStr})`);
    }
  }
  // Handle comparison operators
  else if (expr.type === 'binary_expression' && 
           ['==', '!=', '<', '>', '<=', '>='].includes(expr.operator)) {
    console.log(`DEBUG: Comparison operator: ${expr.operator}`);
    
    // Get operators generator
    const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
    
    if (operatorsGenerator && operatorsGenerator.generate) {
      const expression = operatorsGenerator.generate(expr, context);
      
      // In C, comparison results are integers (1 for true, 0 for false)
      result.format = "%d";
      result.args.push(expression);
      console.log(`DEBUG: Comparison expression -> ${expression}`);
    } else {
      // Fallback
      const leftStr = this.expressionToString(expr.left, context);
      const rightStr = this.expressionToString(expr.right, context);
      result.format = "%d";
      result.args.push(`(${leftStr} ${expr.operator} ${rightStr})`);
    }
  }
  // Handle logical operators
  else if (expr.type === 'binary_expression' && 
           ['&&', '||'].includes(expr.operator)) {
    console.log(`DEBUG: Logical operator: ${expr.operator}`);
    
    // Get operators generator
    const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
    
    if (operatorsGenerator && operatorsGenerator.generate) {
      const expression = operatorsGenerator.generate(expr, context);
      
      // In C, logical results are integers (1 for true, 0 for false)
      result.format = "%d";
      result.args.push(expression);
      console.log(`DEBUG: Logical expression -> ${expression}`);
    } else {
      // Fallback
      const leftStr = this.expressionToString(expr.left, context);
      const rightStr = this.expressionToString(expr.right, context);
      result.format = "%d";
      result.args.push(`(${leftStr} ${expr.operator} ${rightStr})`);
    }
  }
  // Handle unary expressions
  else if (expr.type === 'unary_expression') {
    console.log(`DEBUG: Unary operator: ${expr.operator}`);
    
    // Get operators generator
    const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
    
    if (operatorsGenerator && operatorsGenerator.generate) {
      const expression = operatorsGenerator.generate(expr, context);
      
      // Determine format based on operand type
      const operandType = this.getExpressionType(expr.operand, context);
      const formatSpecifier = this.getFormatSpecifierForType(operandType);
      
      result.format = formatSpecifier;
      result.args.push(expression);
      console.log(`DEBUG: Unary expression -> ${expression}`);
    } else {
      // Fallback
      const operandStr = this.expressionToString(expr.operand, context);
      result.format = "%d";
      result.args.push(`(${expr.operator}${operandStr})`);
    }
  }
  // Handle parenthesized expressions
  else if (expr.type === 'parenthesized_expression') {
    console.log('DEBUG: Parenthesized expression');
    
    // Process the inner expression
    if (expr.expression) {
      return this.extractFormatParts(expr.expression, context);
    }
  }
  
  console.log(`DEBUG: Final result for ${expr.type}: format="${result.format}", args=[${result.args.join(', ')}]`);
  return result;
}


getArrayElementFormatSpecifier(arrayName, context) {
  if (context && context.getSymbol) {
    const symbolInfo = context.getSymbol(arrayName);
    console.log(`Array symbol info for ${arrayName}:`, symbolInfo);
    
    if (symbolInfo) {
      // Check for string array (char*[])
      if (symbolInfo.cType === 'char*[]' || symbolInfo.javaType === 'String[]') {
        console.log(`Array ${arrayName} is string array, using %s`);
        return '%s';
      }
      
      // Check element type
      if (symbolInfo.elementType) {
        console.log(`Array ${arrayName} element type: ${symbolInfo.elementType}`);
        return this.getFormatSpecifierForCType(symbolInfo.elementType);
      }
      
      // Fallback based on C type
      if (symbolInfo.cType) {
        const baseType = symbolInfo.cType.replace('[]', '');
        return this.getFormatSpecifierForCType(baseType);
      }
    }
  }
  
  console.log(`Using default format specifier %d for array ${arrayName}`);
  return '%d'; // Default for integer arrays
}

generateArrayAccessExpression(expr, context) {
  console.log('DEBUG generateArrayAccessExpression START:');
  console.log('Full expr:', JSON.stringify(expr, null, 2));
  
  // Handle nested array access (like matrix[1][2])
  let arrayExpr = '';
  if (expr.array && typeof expr.array === 'object') {
    console.log('expr.array is an object, type:', expr.array.type);
    
    if (expr.array.type === 'array_access' || expr.array.type === 'subscript_expression') {
      // Recursively generate the inner array access
      console.log('Recursively generating nested array access');
      arrayExpr = this.generateArrayAccessExpression(expr.array, context);
    } else if (expr.array.type === 'identifier') {
      arrayExpr = expr.array.name || 'arr';
    } else {
      // Try to get array generator
      const arraysGenerator = context.getGenerator ? context.getGenerator('arrays') : null;
      if (arraysGenerator && arraysGenerator.generate) {
        arrayExpr = arraysGenerator.generate(expr.array, context);
      } else {
        // Fallback
        arrayExpr = 'arr';
      }
    }
  } else {
    // Simple array name
    arrayExpr = expr.array || 'arr';
  }
  
  let index = expr.index || '0';
  
  console.log('arrayExpr:', arrayExpr);
  console.log('index:', index);
  console.log('index type:', typeof index);
  
  // If index is an object (like literal or expression), extract the value
  if (index && typeof index === 'object') {
    console.log('index object type:', index.type);
    
    if (index.type === 'literal') {
      // Extract value from literal
      index = index.value || '0';
    } else if (index.type === 'binary_expression' || index.type === 'member_expression' || index.type === 'field_access') {
      // Generate expression using operators generator
      const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
      if (operatorsGenerator && operatorsGenerator.generate) {
        index = operatorsGenerator.generate(index, context);
      } else {
        index = this.expressionToString(index, context);
      }
    } else if (index.type === 'identifier') {
      // Use identifier name
      index = index.name || '0';
    }
  }
  
  const result = `${arrayExpr}[${index}]`;
  console.log('DEBUG generateArrayAccessExpression END: result =', result);
  return result;
}

// Helper methods to check if expression is a string literal or string expression
isStringLiteral(expr) {
  if (!expr) return false;
  return expr.type === 'string_literal' || 
         (expr.type === 'literal' && typeof expr.value === 'string');
}

isStringExpression(expr) {
  if (!expr) return false;
  
  // Check if it's a string literal
  if (this.isStringLiteral(expr)) return true;
  
  // Check if it's a string concatenation expression
  if (expr.type === 'binary_expression' && expr.operator === '+') {
    return this.isStringExpression(expr.left) || this.isStringExpression(expr.right);
  }
  
  // Check if it's a string variable (identifier with String type)
  if (expr.type === 'identifier' && expr.name) {
    // In real implementation, we would check the symbol table
    // For now, check common string variable names
    const stringNames = ['str', 'name', 'text', 'message', 'msg', 'title', 'label'];
    return stringNames.some(name => expr.name.toLowerCase().includes(name));
  }
  
  return false;
}

  handleExpressionPart(part, context) {
  const result = { format: '', args: [] };
  
  if (!part) return result;
  
  // Handle string literals
  if (typeof part === 'string') {
    result.format = part.replace(/"/g, '');
  } else if (part.type === 'string_literal' || (part.type === 'literal' && part.literalType === 'string')) {
    const strValue = part.value || part.text || '';
    result.format = strValue.replace(/"/g, '');
  } 
  // Handle identifiers (variables)
  else if (part.type === 'identifier') {
    const varName = part.name || 'unknown';
    const actualVarName = this.getActualVariableName(varName, context);
    const formatSpecifier = this.getFormatSpecifier(varName, context);
    
    result.format = formatSpecifier;
    result.args.push(actualVarName);
  } 
  // Handle numeric/boolean literals
  else if (part.type === 'literal') {
    const value = part.value || '0';
    const dataType = part.data_type || 'int';
    const formatSpecifier = this.getFormatSpecifierForType(dataType);
    
    result.format = formatSpecifier;
    result.args.push(this.formatValueForC(value, dataType));
  } 
  // Handle arithmetic or logical expressions - THESE SHOULD BE EVALUATED, NOT ADDED TO FORMAT STRING
  else if (part.type === 'binary_expression' || 
           part.type === 'comparison_expression' || 
           part.type === 'logical_expression' ||
           part.type === 'unary_expression') {
    // These expressions need to be evaluated and included as printf arguments
    const exprGenerator = context?.generators?.operators;
    if (exprGenerator && exprGenerator.generate) {
      const expression = exprGenerator.generate(part, context);
      
      // Get the result type of the expression to determine format specifier
      const exprType = this.getExpressionType(part, context);
      const formatSpecifier = this.getFormatSpecifierForType(exprType);
      
      result.format = formatSpecifier;
      result.args.push(expression);
    } else {
      // Fallback: generate expression text
      const exprText = this.expressionToString(part, context);
      const exprType = this.getExpressionType(part, context);
      const formatSpecifier = this.getFormatSpecifierForType(exprType);
      
      result.format = formatSpecifier;
      result.args.push(exprText);
    }
  }
  // Handle concatenated expressions
  else if (part.type === 'concatenated_expression') {
    // This should not happen here - concatenated expressions should be handled in handleConcatenatedExpression
    console.warn('Unexpected concatenated_expression in handleExpressionPart');
    
    // Fallback: process each part
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(subPart => {
        const subResult = this.handleExpressionPart(subPart, context);
        result.format += subResult.format;
        result.args.push(...subResult.args);
      });
    }
  }
  
  return result;
}

// Helper method to determine expression type
getExpressionType(expr, context) {
  if (!expr) return 'int';
  
  // Handle binary expressions
  if (expr.type === 'binary_expression') {
    const leftType = this.getExpressionType(expr.left, context);
    const rightType = this.getExpressionType(expr.right, context);
    
    // For arithmetic operations, return the dominant type
    const numericTypes = ['int', 'long', 'float', 'double'];
    if (numericTypes.includes(leftType) && numericTypes.includes(rightType)) {
      // Return the higher precision type
      const typePrecedence = { 'double': 4, 'float': 3, 'long': 2, 'int': 1 };
      return typePrecedence[leftType] >= typePrecedence[rightType] ? leftType : rightType;
    }
    
    return leftType; // Default to left type
  }
  
  // Handle identifiers - get type from context
  if (expr.type === 'identifier' && context && context.getSymbol) {
    const symbolInfo = context.getSymbol(expr.name);
    if (symbolInfo) {
      if (symbolInfo.javaType) return symbolInfo.javaType;
      if (symbolInfo.type && symbolInfo.type.javaType) return symbolInfo.type.javaType;
    }
  }
  
  // Handle literals
  if (expr.type === 'literal') {
    return expr.data_type || 'int';
  }
  
  // Default to int
  return 'int';
}

  expressionToString(expr, context) {
  // Convert expression to string representation
  if (!expr) return '0';
  
  if (expr.type === 'binary_expression') {
    const left = this.expressionToString(expr.left, context);
    const right = this.expressionToString(expr.right, context);
    const operator = expr.operator || '+';
    return `(${left} ${operator} ${right})`;
  }
  
  if (expr.type === 'concatenated_expression') {
    // FOR STRING CONCATENATION: Should not be handled here!
    // This should be handled in handleConcatenatedExpression()
    // Return empty string or handle differently
    return ''; // Or better: throw an error or handle properly
  }
  
  if (expr.type === 'unary_expression') {
    const operand = this.expressionToString(expr.operand, context);
    const operator = expr.operator || '!';
    return `(${operator}${operand})`;
  }
  
  if (expr.type === 'identifier') {
    return this.getActualVariableName(expr.name, context);
  }
  
  if (expr.type === 'literal') {
    return expr.value || '0';
  }
  
  return '0';
}
}