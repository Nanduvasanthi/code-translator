export class PrintGenerator {
  canGenerate(astNode) {
    return astNode.type === 'print_statement';
  }

  generate(astNode, context) {
    const indent = context.getIndent();
    
    // Build the print arguments
    let args = '';
    
    if (astNode.arguments && astNode.arguments.length > 0) {
      // For multiple arguments, join them with comma
      const argStrings = astNode.arguments.map(arg => {
        return this.generateArgument(arg, context);
      });
      
      args = argStrings.join(', ');
    }
    
    return `${indent}print(${args})`;
  }

  generateArgument(arg, context) {
    console.log('=== DEBUG generateArgument ===');
    console.log('arg.type:', arg?.type);
    console.log('arg:', JSON.stringify(arg));
    
    // First check: if it's a binary expression with + operator, treat as concatenation
    if (arg.type === 'binary_expression' && arg.operator === '+') {
      return this.handleStringConcatenation(arg, context);
    }
    
    if (arg.type === 'concatenated_expression') {
      // Handle string concatenation: "text: " + var
      // Convert to separate arguments for Python: "text:", var
      const parts = arg.parts || [];
      
      if (parts.length === 2) {
        const [first, second] = parts;
        
        // Check if first part is a string literal
        if (first.type === 'string_literal') {
          let strValue = first.value;
          
          // Clean up the string
          strValue = this.cleanStringValue(strValue);
          
          // Handle different string patterns
          if (strValue.endsWith(' = ')) {
            // For strings ending with " = " (like "a + b = ")
            strValue = strValue.trim();  // Remove trailing space
            const firstArg = `"${strValue}"`;
            const secondArg = this.generateArgument(second, context);
            return `${firstArg}, ${secondArg}`;
            
          } else if (strValue.endsWith(' ') || strValue.endsWith(': ')) {
            // For strings ending with space or ": "
            strValue = strValue.trim();
            if (!strValue.endsWith(':')) {
              strValue += ':';
            }
            const firstArg = `"${strValue}"`;
            const secondArg = this.generateArgument(second, context);
            return `${firstArg}, ${secondArg}`;
          }
          
          // Default: just split the string and expression
          const firstArg = `"${strValue}"`;
          const secondArg = this.generateArgument(second, context);
          return `${firstArg}, ${secondArg}`;
        }
      }
      
      // Fallback for complex concatenations
      const partStrings = parts.map(part => this.generateArgument(part, context));
      return partStrings.join(' + ');
    }
    
    // Handle regular arguments
    if (arg.type === 'string_literal') {
      // Clean up the string value
      const cleanedValue = this.cleanStringValue(arg.value);
      return `"${cleanedValue}"`;
    } else if (arg.type === 'literal') {
      // Handle different literal types
      if (typeof arg.value === 'string') {
        return `"${arg.value}"`;
      } else if (typeof arg.value === 'boolean') {
        return arg.value ? 'True' : 'False';
      }
      return arg.value;
    } else if (arg.type === 'identifier') {
      return arg.name;
    } else if (arg.type === 'binary_expression') {
      // Handle expressions like (a + b)
      return this.generateBinaryExpression(arg, context);
    } else if (arg.type === 'unary_expression') {
      // Handle expressions like !x
      return this.generateUnaryExpression(arg, context);
    } else if (arg.type === 'array_access') {
      // Handle array access like fruits[0]
      console.log('Calling generateArrayAccess for array_access type');
      return this.generateArrayAccess(arg, context);
    } else if (arg.type === 'field_access') {
      // Handle field access like numbers.length
      return this.generateFieldAccess(arg, context);
    }
    
    console.log('=== DEBUG generateArgument: Falling through to default ===');
    console.log('arg:', arg);
    
    // Default fallback - handle object to string conversion properly
    if (arg && typeof arg === 'object') {
      // Try to generate the expression if it has a type
      if (arg.type === 'expression') {
        return this.generateExpression(arg, context);
      }
      return 'None';
    }
    
    return String(arg.value || arg || 'None');
  }

  // Updated generateArrayAccess method with explicit identifier handling
  // Updated generateArrayAccess method
generateArrayAccess(arg, context) {
  console.log('=== DEBUG generateArrayAccess ===');
  console.log('Full arg:', JSON.stringify(arg, null, 2));
  console.log('arg.array:', arg.array);
  console.log('arg.array.type:', arg.array?.type);
  console.log('arg.index:', arg.index);
  console.log('Type of arg.index:', typeof arg.index);
  
  // Handle nested array access (like matrix[1][2])
  if (arg.array && arg.array.type === 'array_access') {
    console.log('Found nested array_access, recursing...');
    const nestedAccess = this.generateArrayAccess(arg.array, context);
    const index = this.generateIndex(arg.index, context);
    const result = `${nestedAccess}[${index}]`;
    console.log('generateArrayAccess returning (nested):', result);
    return result;
  }
  
  // Handle regular array access
  const arrayName = this.generateArrayName(arg.array);
  const index = this.generateIndex(arg.index, context);
  
  const result = `${arrayName}[${index}]`;
  console.log('generateArrayAccess returning:', result);
  return result;
}

// Helper method to extract array name from different structures
generateArrayName(arrayObj) {
  if (typeof arrayObj === 'string') {
    return arrayObj;
  } else if (arrayObj && arrayObj.type === 'identifier') {
    return arrayObj.name;
  } else if (arrayObj && arrayObj.type === 'field_access') {
    return this.generateFieldAccess(arrayObj);
  }
  return arrayObj || '';
}

// Helper method to generate index
// Helper method to generate index
generateIndex(indexObj, context) {
  if (!indexObj) return '0';
  
  if (typeof indexObj === 'object') {
    if (indexObj.type === 'literal') {
      return indexObj.value;
    } else if (indexObj.type === 'binary_expression') {
      // Special case: array[array.length - 1] → array[-1]
      if (this.isLastElementIndex(indexObj)) {
        return '-1';
      }
      
      const expr = this.generateBinaryExpression(indexObj, context);
      
      // generateBinaryExpression already adds parentheses for complex expressions
      // For array indices, we might get double parentheses, so clean them up
      
      // Remove extra parentheses if we have double parentheses
      let cleanExpr = expr;
      while (cleanExpr.startsWith('((') && cleanExpr.endsWith('))')) {
        cleanExpr = cleanExpr.slice(1, -1);
      }
      
      // For simple expressions in array indices, we might not need parentheses
      if (this.isSimpleIndexExpression(cleanExpr)) {
        return cleanExpr;
      }
      
      // Make sure we have parentheses for complex expressions
      if (cleanExpr.startsWith('(') && cleanExpr.endsWith(')')) {
        return cleanExpr;
      }
      
      // Add parentheses if needed
      return `(${cleanExpr})`;
    } else if (indexObj.type === 'identifier') {
      return indexObj.name;
    } else if (indexObj.type === 'field_access') {
      return this.generateFieldAccess(indexObj, context);
    } else if (indexObj.type === 'array_access') {
      return this.generateArrayAccess(indexObj, context);
    }
    // Fallback for other types
    return this.generateArgument(indexObj, context);
  }
  
  return String(indexObj);
}

// Helper to check if it's array.length - 1 pattern
isLastElementIndex(indexObj) {
  if (!indexObj || indexObj.type !== 'binary_expression' || indexObj.operator !== '-') {
    return false;
  }
  
  // Check pattern: something.length - 1
  const left = indexObj.left;
  const right = indexObj.right;
  
  // Check right side is literal 1
  if (!right || right.type !== 'literal' || right.value !== 1) {
    return false;
  }
  
  // Check left side is a field access with .length
  if (!left || left.type !== 'field_access' || left.field !== 'length') {
    return false;
  }
  
  return true;
}

// Helper to check if expression is simple enough to not need parentheses in array index
isSimpleIndexExpression(expr) {
  if (!expr) return false;
  
  // Remove any outer parentheses first
  let cleanExpr = expr;
  while (cleanExpr.startsWith('(') && cleanExpr.endsWith(')')) {
    cleanExpr = cleanExpr.slice(1, -1);
  }
  
  // Check if it contains nested parentheses (needs them)
  if (cleanExpr.includes('(') || cleanExpr.includes(')')) {
    return false;
  }
  
  // Count operators
  const operators = ['+', '-', '*', '/', '%'];
  let operatorCount = 0;
  
  for (const op of operators) {
    // Count occurrences but avoid counting negative signs
    const regex = new RegExp(`(?<![-+*/%])${op.replace('*', '\\*').replace('+', '\\+')}(?!\\s*-)`, 'g');
    const matches = cleanExpr.match(regex);
    if (matches) {
      operatorCount += matches.length;
    }
  }
  
  // Simple expressions: single variable, single number, or simple arithmetic with 1 operator
  return operatorCount <= 1;
}

  generateFieldAccess(arg, context) {
    const object = this.generateArgument(arg.object, context);
    const field = arg.field;
    
    // Handle common field accesses
    if (field === 'length') {
      return `len(${object})`; // Convert Java .length to Python len()
    }
    
    return `${object}.${field}`;
  }

  // Rest of the methods remain the same...
  // Replace the entire handleStringConcatenation method with this improved version:
handleStringConcatenation(arg, context) {
  console.log('=== DEBUG handleStringConcatenation ===');
  console.log('arg:', JSON.stringify(arg, null, 2));
  
  // Check if this is a complex concatenation like "(" + i + ", " + j + ")"
  const isComplexConcatenation = this.isComplexStringConcatenation(arg);
  
  if (isComplexConcatenation) {
    // For complex concatenations, build a single Python string
    return this.buildComplexConcatenatedString(arg, context);
  }
  
  // Simple case: "text: " + variable
  return this.handleSimpleConcatenation(arg, context);
}

// Helper method to detect complex concatenations
isComplexStringConcatenation(arg) {
  if (!arg || arg.type !== 'binary_expression' || arg.operator !== '+') {
    return false;
  }
  
  // Count the depth of nested concatenations
  let depth = 0;
  let current = arg;
  
  while (current && current.type === 'binary_expression' && current.operator === '+') {
    depth++;
    current = current.left;
  }
  
  // If depth > 1, it's a complex concatenation like "(" + i + ", " + j + ")"
  return depth > 1;
}

// Build a single Python string for complex concatenations
// Update the buildComplexConcatenatedString method in PrintGenerator:
buildComplexConcatenatedString(arg, context) {
  console.log('Building complex concatenated string');
  
  // Extract all parts of the concatenation
  const parts = this.extractConcatenationParts(arg);
  console.log('Extracted parts:', parts);
  
  // Check if we should use f-strings (more Pythonic)
  const shouldUseFString = this.shouldUseFString(parts);
  
  if (shouldUseFString) {
    return this.buildFString(parts, context);
  }
  
  // Build using string concatenation with str() conversions
  const pythonParts = parts.map(part => {
    if (part.type === 'string_literal' || 
        (part.type === 'literal' && typeof part.value === 'string')) {
      // String literals - just use the value
      const strValue = part.type === 'string_literal' ? part.value : part.value;
      const cleaned = this.cleanStringValue(strValue);
      return `"${cleaned}"`;
    } else {
      // Variables or other expressions - wrap in str() for concatenation
      const expr = this.generateArgument(part, context);
      
      // Check the type to see if str() is needed
      const needsStrConversion = this.needsStrConversion(part);
      
      if (needsStrConversion) {
        return `str(${expr})`;
      } else {
        return expr;
      }
    }
  });
  
  // Join with + operator for Python
  return pythonParts.join(' + ');
}

// Helper to determine if we need str() conversion
needsStrConversion(part) {
  // Don't need str() for:
  // 1. String literals (handled above)
  // 2. Expressions that are already strings
  // 3. Boolean values
  
  if (part.type === 'string_literal') {
    return false;
  }
  
  if (part.type === 'literal') {
    // Numbers need str(), booleans and strings don't
    if (typeof part.value === 'number') {
      return true;
    }
    return false; // booleans, strings
  }
  
  if (part.type === 'identifier') {
    // Assume identifiers might be numbers, so need str()
    return true;
  }
  
  // For other types (array_access, field_access, etc.), need str()
  return true;
}

// Check if we should use f-strings
shouldUseFString(parts) {
  // Count non-string parts
  const nonStringCount = parts.filter(part => {
    return !(part.type === 'string_literal' || 
            (part.type === 'literal' && typeof part.value === 'string'));
  }).length;
  
  // Use f-string if we have a few variables mixed with strings
  return nonStringCount <= 3 && parts.length <= 5;
}

// Build f-string
buildFString(parts, context) {
  let fString = 'f"';
  
  for (const part of parts) {
    if (part.type === 'string_literal' || 
        (part.type === 'literal' && typeof part.value === 'string')) {
      const strValue = part.type === 'string_literal' ? part.value : part.value;
      // Escape quotes in f-string
      const escaped = strValue.replace(/"/g, '\\"');
      fString += escaped;
    } else {
      const expr = this.generateArgument(part, context);
      fString += `{${expr}}`;
    }
  }
  
  fString += '"';
  return fString;
}

// Extract all parts from nested concatenations
extractConcatenationParts(arg) {
  const parts = [];
  
  const extract = (node) => {
    if (!node || node.type !== 'binary_expression' || node.operator !== '+') {
      parts.push(node);
      return;
    }
    
    // Recursively extract left side
    extract(node.left);
    // Add right side
    parts.push(node.right);
  };
  
  extract(arg);
  return parts;
}

// Handle simple concatenations: "text: " + variable
handleSimpleConcatenation(arg, context) {
  const left = arg.left;
  const right = arg.right;
  
  // Check if left is a string literal
  if (left && (left.type === 'string_literal' || 
               (left.type === 'literal' && typeof left.value === 'string'))) {
    
    // Get string value
    let strValue = left.type === 'string_literal' ? left.value : left.value;
    strValue = this.cleanStringValue(strValue);
    
    // Generate the second argument
    const secondArg = this.generateArgument(right, context);
    
    // Return as separate arguments
    return `"${strValue}", ${secondArg}`;
  }
  
  // Check if right is a string literal and left is not
  if (right && (right.type === 'string_literal' || 
                (right.type === 'literal' && typeof right.value === 'string'))) {
    
    // Get string value
    let strValue = right.type === 'string_literal' ? right.value : right.value;
    strValue = this.cleanStringValue(strValue);
    
    // Generate the first argument
    const firstArg = this.generateArgument(left, context);
    
    // Return as separate arguments
    return `${firstArg}, "${strValue}"`;
  }
  
  // Fallback: generate as binary expression
  return this.generateBinaryExpression(arg, context);
}

  // In the generateBinaryExpression method:
generateBinaryExpression(arg, context) {
  // Get the operators generator to properly convert operators
  const operatorsGen = context.getGenerator('operators');
  
  if (arg.left && arg.right && arg.operator) {
    const left = this.generateArgument(arg.left, context);
    const right = this.generateArgument(arg.right, context);
    
    // Convert Java operator to Python operator
    const pythonOperator = this.convertOperator(arg.operator);
    
    // Special handling for logical operators in print statements
    if (pythonOperator === 'and' || pythonOperator === 'or') {
      return `(${left} ${pythonOperator} ${right})`;
    }
    
    // For simple arithmetic expressions, we might not need parentheses
    // Check if parentheses are needed
    const needsParentheses = this.needsParentheses(arg, left, right);
    
    if (needsParentheses) {
      return `(${left} ${pythonOperator} ${right})`;
    } else {
      return `${left} ${pythonOperator} ${right}`;
    }
  }
  return `(${arg.text || arg.value || ''})`;
}

// Helper to determine if parentheses are needed
needsParentheses(arg, left, right) {
  // Always parenthesize complex expressions
  if (left.includes('(') || left.includes(' ') || 
      right.includes('(') || right.includes(' ')) {
    return true;
  }
  
  // For simple variable/number operations, no parentheses needed
  const isSimpleLeft = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(left) || /^\d+$/.test(left);
  const isSimpleRight = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(right) || /^\d+$/.test(right);
  
  if (isSimpleLeft && isSimpleRight) {
    return false;
  }
  
  return true;
}

  generateUnaryExpression(arg, context) {
    if (arg.operator && arg.operand) {
      const operand = this.generateArgument(arg.operand, context);
      
      // Convert Java unary operators to Python
      if (arg.operator === '!') {
        return `(not ${operand})`;
      } else if (arg.operator === '-') {
        return `(-${operand})`;
      } else if (arg.operator === '~') {
        return `(~${operand})`;
      }
      
      return `(${arg.operator}${operand})`;
    }
    return 'None';
  }

  generateExpression(expr, context) {
    // Generic expression generator
    if (expr.type === 'binary_expression') {
      return this.generateBinaryExpression(expr, context);
    } else if (expr.type === 'unary_expression') {
      return this.generateUnaryExpression(expr, context);
    } else if (expr.type === 'identifier') {
      return expr.name;
    } else if (expr.type === 'literal') {
      if (typeof expr.value === 'boolean') {
        return expr.value ? 'True' : 'False';
      }
      return expr.value;
    }
    return 'None';
  }

  cleanStringValue(strValue) {
    // Remove trailing spaces
    let cleaned = strValue.trim();
    
    // Clean up specific patterns for print statements
    // Remove trailing " = " and replace with " ="
    cleaned = cleaned.replace(/ = $/, ' =');
    // Remove trailing ": " and replace with ":"
    cleaned = cleaned.replace(/: $/, ':');
    // Remove trailing space
    cleaned = cleaned.replace(/ $/, '');
    
    return cleaned;
  }

  convertOperator(javaOperator) {
    // Convert Java operators to Python operators
    const operatorMap = {
      '&&': 'and',
      '||': 'or',
      '!=': '!=',
      '==': '==',
      '>': '>',
      '<': '<',
      '>=': '>=',
      '<=': '<=',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '//',
      '%': '%',
      '^': '**',
      '&': '&',
      '|': '|'
    };
    
    return operatorMap[javaOperator] || javaOperator;
  }
}