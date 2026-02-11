export class JavaOperatorsGenerator {
  constructor() {
    console.log('✅ C JavaOperatorsGenerator initialized');
  }

  canGenerate(astNode) {
    return astNode.type === 'binary_expression' ||
           astNode.type === 'unary_expression' ||
           astNode.type === 'logical_expression' ||
           astNode.type === 'comparison_expression' ||
           astNode.type === 'assignment_expression' ||
           astNode.type === 'update_expression';
  }

  generate(astNode, context) {
    if (!this.canGenerate(astNode)) {
      console.warn(`JavaOperatorsGenerator cannot generate node type: ${astNode.type}`);
      return '';
    }

    console.log(`JavaOperatorsGenerator processing: ${astNode.type}`);

    switch (astNode.type) {
      case 'binary_expression':
        return this.generateBinaryExpression(astNode, context);
      case 'unary_expression':
        return this.generateUnaryExpression(astNode, context);
      case 'logical_expression':
        return this.generateLogicalExpression(astNode, context);
      case 'comparison_expression':
        return this.generateComparisonExpression(astNode, context);
      case 'assignment_expression':
        return this.generateAssignmentExpression(astNode, context);
      case 'update_expression':
        return this.generateUpdateExpression(astNode, context);
      default:
        return '';
    }
  }

  generateBinaryExpression(astNode, context) {
    const left = this.generateExpression(astNode.left, context);
    const right = this.generateExpression(astNode.right, context);
    const operator = this.mapJavaOperatorToC(astNode.operator);
    
    // For simple expressions (identifiers or literals), no parentheses needed
    // Only add parentheses for complex or nested expressions
    const leftNeedsParen = this.expressionNeedsParentheses(astNode.left);
    const rightNeedsParen = this.expressionNeedsParentheses(astNode.right);
    
    if (leftNeedsParen || rightNeedsParen) {
      return `(${left} ${operator} ${right})`;
    } else {
      return `${left} ${operator} ${right}`;
    }
  }

  generateUnaryExpression(astNode, context) {
    const operand = this.generateExpression(astNode.operand, context);
    const operator = this.mapJavaOperatorToC(astNode.operator);
    
    // Most unary operators are prefix in Java (!, ~, ++, --)
    const isPrefix = astNode.isPrefix !== false;  // Default to true if not specified
    
    // Unary expressions generally need parentheses to maintain precedence
    if (isPrefix) {
      return `${operator}${operand}`;
    } else {
      return `${operand}${operator}`;
    }
  }

  generateLogicalExpression(astNode, context) {
    const left = this.generateExpression(astNode.left, context);
    const right = this.generateExpression(astNode.right, context);
    const operator = this.mapJavaOperatorToC(astNode.operator);
    
    // Logical expressions often need parentheses due to operator precedence
    const leftNeedsParen = this.expressionNeedsParentheses(astNode.left);
    const rightNeedsParen = this.expressionNeedsParentheses(astNode.right);
    
    if (leftNeedsParen || rightNeedsParen) {
      return `(${left} ${operator} ${right})`;
    } else {
      return `${left} ${operator} ${right}`;
    }
  }

  generateComparisonExpression(astNode, context) {
    const left = this.generateExpression(astNode.left, context);
    const right = this.generateExpression(astNode.right, context);
    const operator = this.mapJavaOperatorToC(astNode.operator);
    
    // Comparison expressions often need parentheses due to operator precedence
    const leftNeedsParen = this.expressionNeedsParentheses(astNode.left);
    const rightNeedsParen = this.expressionNeedsParentheses(astNode.right);
    
    if (leftNeedsParen || rightNeedsParen) {
      return `(${left} ${operator} ${right})`;
    } else {
      return `${left} ${operator} ${right}`;
    }
  }

  generateAssignmentExpression(astNode, context) {
    const left = this.generateExpression(astNode.left, context);
    const right = this.generateExpression(astNode.right, context);
    const operator = this.mapJavaOperatorToC(astNode.operator);
    
    return `${left} ${operator} ${right}`;
  }

  generateUpdateExpression(astNode, context) {
    const operand = this.generateExpression(astNode.operand, context);
    const operator = this.mapJavaOperatorToC(astNode.operator);
    
    if (astNode.isPrefix) {
      return `${operator}${operand}`;
    } else {
      return `${operand}${operator}`;
    }
  }

  generateExpression(expr, context) {
  if (!expr) return '0';
  
  if (typeof expr === 'string') return expr;
  
  console.log(`JavaOperatorsGenerator generateExpression: type=${expr.type}`);
  
  if (expr.type === 'identifier') {
    return expr.name || 'undefined';
  }
  
  if (expr.type === 'literal') {
    return this.formatLiteral(expr, context);
  }
  
  // Handle field access (e.g., array.length)
  if (expr.type === 'field_access' || expr.type === 'member_expression') {
    console.log('Processing field access:', expr);
    
    const objectName = expr.object?.name || expr.name || 'obj';
    const fieldName = expr.field || expr.property || 'field';
    
    console.log(`Field access: ${objectName}.${fieldName}`);
    
    // Special case: array.length
    if (fieldName === 'length') {
      // Check if it's an array by looking up in context
      const isArray = context && context.getSymbol && context.getSymbol(objectName);
      
      if (isArray) {
        // Convert to C array size calculation
        console.log(`Converting array.length to sizeof(${objectName})/sizeof(${objectName}[0])`);
        return `sizeof(${objectName}) / sizeof(${objectName}[0])`;
      }
    }
    
    // For other field accesses, convert to appropriate C syntax
    // In C, we might use struct member access or function calls
    return `${objectName}.${fieldName}`;
  }
  
  // Handle nested expressions
  if (expr.type === 'binary_expression' || 
      expr.type === 'unary_expression' ||
      expr.type === 'logical_expression' ||
      expr.type === 'comparison_expression') {
    return this.generate(expr, context);
  }
  
  // Handle array access
  if (expr.type === 'array_access' || expr.type === 'subscript_expression') {
    // Get array generator from context
    const arraysGenerator = context.getGenerator ? context.getGenerator('arrays') : null;
    if (arraysGenerator && arraysGenerator.generate) {
      return arraysGenerator.generate(expr, context);
    }
    
    // Fallback
    const arrayName = expr.array || expr.name || 'arr';
    let index = expr.index || '0';
    
    if (index && typeof index === 'object') {
      if (index.type === 'literal') {
        index = index.value || '0';
      } else {
        index = this.generateExpression(index, context);
      }
    }
    
    return `${arrayName}[${index}]`;
  }
  
  console.warn(`JavaOperatorsGenerator: Unknown expression type: ${expr.type}`);
  return '0';
}

  // Helper method to determine if an expression needs parentheses
  expressionNeedsParentheses(expr) {
    if (!expr) return false;
    
    // Simple expressions don't need parentheses
    if (expr.type === 'identifier' || expr.type === 'literal') {
      return false;
    }
    
    // Complex expressions need parentheses
    if (expr.type === 'binary_expression' ||
        expr.type === 'unary_expression' ||
        expr.type === 'logical_expression' ||
        expr.type === 'comparison_expression') {
      return true;
    }
    
    // Default to true for unknown expression types
    return true;
  }

  formatLiteral(operand, context) {
    if (!operand) return '0';
    
    if (operand.type === 'literal') {
      if (operand.literalType === 'boolean') {
        // Use true/false if stdbool.h is included, otherwise 1/0
        const useBoolLiterals = context && context.translator && context.translator.needsStdbool;
        if (useBoolLiterals) {
          return operand.value === 'true' || operand.value === true ? 'true' : 'false';
        } else {
          return operand.value === 'true' || operand.value === true ? '1' : '0';
        }
      }
      return operand.value || '0';
    }
    
    return '0';
  }

  mapJavaOperatorToC(javaOperator) {
    const operatorMap = {
      // Arithmetic
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%',
      '++': '++',
      '--': '--',
      
      // Assignment
      '=': '=',
      '+=': '+=',
      '-=': '-=',
      '*=': '*=',
      '/=': '/=',
      '%=': '%=',
      
      // Comparison
      '==': '==',
      '!=': '!=',
      '>': '>',
      '<': '<',
      '>=': '>=',
      '<=': '<=',
      
      // Logical
      '&&': '&&',
      '||': '||',
      '!': '!'
    };
    
    return operatorMap[javaOperator] || javaOperator;
  }
}