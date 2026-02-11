export class PrintParser {
  canParse(node) {
    return node.type === 'method_invocation' && 
           (node.text.includes('System.out.println') || 
            node.text.includes('System.out.print'));
  }

  parse(node, context) {
    const args = [];
    let isPrintln = false;
    
    // Check if it's println or print
    if (node.text.includes('System.out.println')) {
      isPrintln = true;
    }
    
    // Extract arguments
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'argument_list') {
        this.extractArguments(child, args, context);
        break;
      }
    }
    
    return {
      type: 'print_statement',
      method: isPrintln ? 'println' : 'print',
      arguments: args,
      isNewLine: isPrintln
    };
  }

  extractArguments(node, args, context) {
    let currentArg = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === '(' || child.type === ')') {
        // Skip parentheses
        continue;
      } else if (child.type === ',') {
        // End of current argument
        if (currentArg.length > 0) {
          args.push(this.parseArgumentGroup(currentArg, context));
          currentArg = [];
        }
      } else if (child.type === 'binary_expression' && child.text && child.text.includes('+')) {
        // Handle string concatenation
        const parsedExpr = this.parseBinaryExpression(child, context);
        if (parsedExpr) {
          currentArg.push(parsedExpr);
        }
      } else if (child.type === 'binary_expression' || 
                 child.type === 'array_access' || 
                 child.type === 'field_access') {
        // Handle other binary expressions, array access, and field access
        const parsedExpr = this.parseSingleArgument(child, context);
        if (parsedExpr) {
          currentArg.push(parsedExpr);
        }
      } else {
        // Add to current argument
        currentArg.push(child);
      }
    }
    
    // Add the last argument
    if (currentArg.length > 0) {
      args.push(this.parseArgumentGroup(currentArg, context));
    }
  }

  parseArgumentGroup(nodes, context) {
    if (nodes.length === 1) {
      const node = nodes[0];
      if (node.type === 'binary_expression' || node.type === 'concatenated_expression') {
        return node;
      }
      return this.parseSingleArgument(node, context);
    } else {
      // Handle multiple nodes as a concatenated expression
      const parts = nodes.map(node => {
        if (node.type === 'binary_expression' || node.type === 'concatenated_expression') {
          return node;
        }
        return this.parseSingleArgument(node, context);
      });
      return {
        type: 'concatenated_expression',
        parts: parts
      };
    }
  }

  parseSingleArgument(node, context) {
    // Add null check for node
    if (!node) {
      return { type: 'unknown', value: 'null' };
    }
    
    // Check if it's already an AST node (not a tree-sitter node)
    // Tree-sitter nodes have .type and .text properties (text is a string)
    // AST nodes have .type but .text is either undefined, null, or not a string
    if (node.type && (node.text === undefined || node.text === null || typeof node.text !== 'string')) {
      // Already an AST node, return it as-is
      console.log('parseSingleArgument: Already an AST node, returning as-is:', node.type);
      return node;
    }
    
    // Also check if it's an object with .type property but no .childCount (AST node)
    if (typeof node === 'object' && node.type && node.childCount === undefined) {
      console.log('parseSingleArgument: Already an AST node (no .childCount), returning as-is:', node.type);
      return node;
    }
    
    if (node.type === 'string_literal') {
      const text = node.text || '';
      const value = text.length >= 2 ? text.substring(1, text.length - 1) : '';
      return { type: 'string_literal', value: value };
      
    } else if (node.type === 'integer_literal') {
      let val = node.text || '';
      // Remove type suffixes
      if (val.endsWith('L') || val.endsWith('l')) {
        val = val.slice(0, -1);
      }
      return { type: 'literal', value: parseInt(val) || 0 };
      
    } else if (node.type === 'float_literal') {
      let val = node.text || '';
      // Remove type suffixes
      if (val.endsWith('F') || val.endsWith('f')) {
        val = val.slice(0, -1);
      }
      return { type: 'literal', value: parseFloat(val) || 0.0 };
      
    } else if (node.type === 'identifier') {
      return { type: 'identifier', name: node.text || 'unknown' };
      
    } else if (node.type === 'true' || node.type === 'false') {
      return { type: 'literal', value: node.type === 'true' };
      
    } else if (node.type === 'binary_expression') {
      return this.parseBinaryExpression(node, context);
      
    } else if (node.type === 'parenthesized_expression') {
      // Handle expressions inside parentheses
      return this.parseParenthesizedExpression(node, context);
      
    } else if (node.type === 'concatenated_expression') {
      return node;
      
    } else if (node.type === 'array_access') {
      // Handle array access like fruits[0]
      return this.parseArrayAccess(node, context);
      
    } else if (node.type === 'field_access') {
      // Handle field access like numbers.length
      return this.parseFieldAccess(node, context);
      
    } else if (node.type === 'decimal_integer_literal') {
      // Handle decimal integer literals (e.g., 123)
      return { type: 'literal', value: parseInt(node.text || '0') };
    }
    
    return { type: 'unknown', value: node.text || 'unknown' };
  }

 parseArrayAccess(node, context) {
  console.log('=== DEBUG parseArrayAccess ===');
  console.log('Node type:', node.type);
  
  // Check if it's already an AST node
  if (node.type === 'array_access' && (node.text === undefined || node.text === null || typeof node.text !== 'string')) {
    console.log('Already an array_access AST node, returning as-is');
    return node;
  }
  
  // Check for undefined node.text
  if (!node.text) {
    console.log('Node text is undefined, using empty string');
    node.text = '';
  }
  
  console.log('Node text:', node.text);
  console.log('Child count:', node.childCount);
  
  let arrayName = null;
  let index = null;
  let foundArrayName = false;
  
  // Parse array access structure: identifier [ expression ]
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    console.log(`  Child [${i}]: ${child.type}: "${child.text}"`);
    
    if (child.type === 'identifier' && !foundArrayName) {
      // First identifier is the array name
      arrayName = child.text;
      foundArrayName = true;
      console.log('Found array name:', arrayName);
    } else if (child.type === 'array_access') {
      // Nested array access like matrix[1][2]
      console.log('Found nested array access');
      // Parse the inner array access (matrix[1])
      const innerArrayAccess = this.parseArrayAccess(child, context);
      // Set arrayName to the inner array access, not the identifier
      arrayName = innerArrayAccess;
      console.log('Parsed inner array access:', innerArrayAccess);
    } else if (child.type === 'binary_expression') {
      // Complex index like numbers.length - 1
      console.log('Found binary expression, parsing...');
      index = this.parseBinaryExpression(child, context);
      console.log('Parsed binary expression index:', index);
    } else if (child.type === 'identifier') {
      // Variable index like numbers[i]
      // Check if we already found the array name
      if (foundArrayName) {
        index = { type: 'identifier', name: child.text };
        console.log('Found variable index:', index);
      } else {
        // This is the array name
        arrayName = child.text;
        foundArrayName = true;
        console.log('Found array name (fallback):', arrayName);
      }
    } else if (child.type === 'decimal_integer_literal' || child.type === 'integer_literal') {
      // Numeric index
      index = { type: 'literal', value: parseInt(child.text) };
      console.log('Found numeric index:', index);
    } else if (child.type === 'field_access') {
      // Index is a field access like numbers.length
      index = this.parseFieldAccess(child, context);
      console.log('Found field access index:', index);
    }
  }
  
  // Build the result
  const result = {
    type: 'array_access',
    array: arrayName || 'unknown',
    index: index || { type: 'unknown', value: '0' }
  };
  
  console.log('Parsed array access:', result);
  return result;
}

  parseFieldAccess(node, context) {
    let object = null;
    let field = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'identifier') {
        if (!object) {
          object = { type: 'identifier', name: child.text };
        } else {
          field = child.text;
        }
      } else if (child.type === '.') {
        // Skip dot operator
        continue;
      }
    }
    
    return {
      type: 'field_access',
      object: object,
      field: field
    };
  }

  parseParenthesizedExpression(node, context) {
    // Look for the expression inside parentheses
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'binary_expression') {
        return this.parseBinaryExpression(child, context);
      } else if (child.type === 'identifier') {
        return this.parseSingleArgument(child, context);
      } else if (child.type === 'unary_expression') {
        return this.parseUnaryExpression(child, context);
      } else if (child.type === 'array_access' || child.type === 'field_access') {
        return this.parseSingleArgument(child, context);
      }
    }
    
    return { type: 'unknown', value: node.text || 'unknown' };
  }

  parseBinaryExpression(node, context) {
    console.log('=== DEBUG parseBinaryExpression ===');
    console.log('Binary expression text:', node.text);
    console.log('Child count:', node.childCount);
    
    // Log all children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      console.log(`  Child [${i}]: ${child.type}: "${child.text}"`);
    }
    
    let left = null;
    let right = null;
    let operator = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'identifier' || 
          child.type === 'integer_literal' ||
          child.type === 'float_literal' ||
          child.type === 'true' || 
          child.type === 'false' ||
          child.type === 'parenthesized_expression' ||
          child.type === 'string_literal' ||
          child.type === 'binary_expression' ||
          child.type === 'array_access' ||
          child.type === 'field_access' ||
          child.type === 'decimal_integer_literal') {
        
        if (left === null) {
          left = this.parseSingleArgument(child, context);
          console.log('Parsed left operand:', left);
        } else if (right === null) {
          right = this.parseSingleArgument(child, context);
          console.log('Parsed right operand:', right);
        }
      } else if (child.type === '+' || child.type === '-' || 
                 child.type === '*' || child.type === '/' ||
                 child.type === '%' || child.type === '&&' ||
                 child.type === '||' || child.type === '==' ||
                 child.type === '!=' || child.type === '<' ||
                 child.type === '>' || child.type === '<=' ||
                 child.type === '>=') {
        operator = child.type;
        console.log('Found operator:', operator);
      }
    }
    
    if (left && right && operator) {
      const result = {
        type: 'binary_expression',
        left: left,
        operator: operator,
        right: right
      };
      console.log('Successfully parsed binary expression:', result);
      return result;
    }
    
    // Fallback: try to parse as concatenated expression for + operator
    if (operator === '+' && node.text && node.text.includes('+')) {
      console.log('Trying to parse as concatenated expression');
      return this.parseConcatenatedExpression(node, context);
    }
    
    console.log('Could not parse binary expression, returning unknown');
    return { type: 'unknown', value: node.text || 'unknown' };
  }

  parseUnaryExpression(node, context) {
    // Parse unary expressions like !x, -y, etc.
    let operator = null;
    let operand = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === '!' || child.type === '-' || child.type === '~') {
        operator = child.type;
      } else if (child.type === 'identifier' || 
                 child.type === 'integer_literal' ||
                 child.type === 'float_literal' ||
                 child.type === 'true' || 
                 child.type === 'false' ||
                 child.type === 'parenthesized_expression' ||
                 child.type === 'array_access' ||
                 child.type === 'field_access') {
        operand = this.parseSingleArgument(child, context);
      }
    }
    
    if (operator && operand) {
      return {
        type: 'unary_expression',
        operator: operator,
        operand: operand
      };
    }
    
    return { type: 'unknown', value: node.text || 'unknown' };
  }

  parseConcatenatedExpression(node, context) {
    const parts = [];
    
    const extractParts = (currentNode) => {
      if (currentNode.type === 'binary_expression' && currentNode.text && currentNode.text.includes('+')) {
        // Recursively extract left and right parts
        for (let i = 0; i < currentNode.childCount; i++) {
          const child = currentNode.child(i);
          if (child.type !== '+') {
            extractParts(child);
          }
        }
      } else if (currentNode.type === 'parenthesized_expression') {
        // Extract expression inside parentheses
        const innerExpr = this.parseParenthesizedExpression(currentNode, context);
        parts.push(innerExpr);
      } else {
        parts.push(this.parseSingleArgument(currentNode, context));
      }
    };
    
    extractParts(node);
    
    return {
      type: 'concatenated_expression',
      parts: parts
    };
  }
}