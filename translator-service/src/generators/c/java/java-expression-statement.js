export class JavaExpressionStatementGenerator {
  constructor() {
    console.log('✅ C JavaExpressionStatementGenerator initialized');
  }

  canGenerate(astNode) {
    return astNode.type === 'expression_statement' ||
           astNode.type === 'statement_expression';
  }

  generate(astNode, context) {
    if (!this.canGenerate(astNode)) {
      console.warn(`JavaExpressionStatementGenerator cannot generate node type: ${astNode.type}`);
      return '';
    }

    console.log(`JavaExpressionStatementGenerator processing expression statement`);

    // This generator handles standalone expressions that need to become statements
    // For example: x++; or functionCall();
    
    if (astNode.expression) {
      const expression = this.generateExpression(astNode.expression, context);
      return `${expression};`;
    }
    
    return ';';
  }

  generateExpression(expr, context) {
  if (!expr) return '';
  
  if (typeof expr === 'string') return expr;
  
  console.log(`Generating expression type: ${expr.type}`);
  
  // Handle different expression types
  switch (expr.type) {
    case 'call_expression':
      return this.generateCallExpression(expr, context);
    case 'assignment_expression':
      return this.generateAssignmentExpression(expr, context);
    case 'update_expression':
      return this.generateUpdateExpression(expr, context);
    case 'array_access':
    case 'subscript_expression':
      return this.generateArrayAccessExpression(expr, context);
    case 'binary_expression':
      return this.generateBinaryExpression(expr, context);
    case 'unary_expression':
      return this.generateUnaryExpression(expr, context);
    case 'parenthesized_expression':
      return this.generateParenthesizedExpression(expr, context);
    case 'member_expression':
      return this.generateMemberExpression(expr, context);
    default:
      console.log(`Unknown expression type: ${expr.type}`);
      return expr.name || expr.value || '';
  }
}

// Add these new methods to handle array access and other expressions:

generateArrayAccessExpression(expr, context) {
  console.log('Generating array access expression:', expr);
  
  // Get array generator from context
  const arraysGenerator = context.getGenerator ? context.getGenerator('arrays') : null;
  
  if (arraysGenerator && arraysGenerator.generate) {
    return arraysGenerator.generate(expr, context);
  }
  
  // Fallback: simple array access
  const arrayName = expr.array_name || expr.name || 'arr';
  const index = expr.index || '0';
  return `${arrayName}[${index}]`;
}

generateBinaryExpression(expr, context) {
  console.log('Generating binary expression:', expr);
  
  // Get operators generator from context
  const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
  
  if (operatorsGenerator && operatorsGenerator.generate) {
    return operatorsGenerator.generate(expr, context);
  }
  
  // Fallback
  const left = this.generateExpression(expr.left, context);
  const right = this.generateExpression(expr.right, context);
  const operator = expr.operator || '+';
  return `(${left} ${operator} ${right})`;
}

generateUnaryExpression(expr, context) {
  console.log('Generating unary expression:', expr);
  
  // Get operators generator from context
  const operatorsGenerator = context.getGenerator ? context.getGenerator('operators') : null;
  
  if (operatorsGenerator && operatorsGenerator.generate) {
    return operatorsGenerator.generate(expr, context);
  }
  
  // Fallback
  const operand = this.generateExpression(expr.operand, context);
  const operator = expr.operator || '!';
  return `(${operator}${operand})`;
}

generateParenthesizedExpression(expr, context) {
  console.log('Generating parenthesized expression:', expr);
  
  if (expr.expression) {
    const inner = this.generateExpression(expr.expression, context);
    return `(${inner})`;
  }
  
  return '()';
}

generateMemberExpression(expr, context) {
  console.log('Generating member expression:', expr);
  
  const object = expr.object || expr.name || 'obj';
  const property = expr.property || 'prop';
  
  // Special case: array.length
  if (property === 'length') {
    // Convert to C array size calculation
    return `sizeof(${object}) / sizeof(${object}[0])`;
  }
  
  return `${object}.${property}`;
}

// Also update generateOperand to handle expressions:
generateOperand(operand, context) {
  if (!operand) return '0';
  
  if (typeof operand === 'string') return operand;
  
  // If it's a complex expression, generate it
  if (operand.type && [
    'array_access', 'subscript_expression', 'binary_expression',
    'unary_expression', 'member_expression', 'parenthesized_expression'
  ].includes(operand.type)) {
    return this.generateExpression(operand, context);
  }
  
  if (operand.type === 'identifier') {
    return operand.name || 'undefined';
  }
  
  if (operand.type === 'literal') {
    return operand.value || '0';
  }
  
  return '0';
}


  generateCallExpression(expr, context) {
    const funcName = expr.function_name || 'unknown';
    const args = (expr.arguments || []).map(arg => {
      if (typeof arg === 'object' && arg.value !== undefined) {
        return arg.value;
      }
      return arg;
    }).join(', ');
    
    return `${funcName}(${args})`;
  }

  generateAssignmentExpression(expr, context) {
    const left = expr.left && expr.left.name ? expr.left.name : 'var';
    const right = expr.right ? this.generateOperand(expr.right, context) : '0';
    const operator = expr.operator || '=';
    
    return `${left} ${operator} ${right}`;
  }

  generateUpdateExpression(expr, context) {
    const operand = expr.operand && expr.operand.name ? expr.operand.name : 'var';
    const operator = expr.operator || '++';
    
    if (expr.is_postfix) {
      return `${operand}${operator}`;
    } else {
      return `${operator}${operand}`;
    }
  }

  generateOperand(operand, context) {
    if (!operand) return '0';
    
    if (typeof operand === 'string') return operand;
    
    if (operand.type === 'identifier') {
      return operand.name || 'undefined';
    }
    
    if (operand.type === 'literal') {
      return operand.value || '0';
    }
    
    return '0';
  }
}