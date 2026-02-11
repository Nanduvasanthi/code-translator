// generators/java/c-operators.js - FIXED VERSION
export class COperatorsGenerator {
    
  generate(astNode, context, visitor) {
    if (!astNode) return '';
    
    console.log(`DEBUG COperatorsGenerator: Generating for ${astNode.type}, operator: ${astNode.operator}`);
    
    let result = '';
    
    if (astNode.type === 'binary_expression') {
      result = this.generateBinaryExpression(astNode, visitor);
    } else if (astNode.type === 'unary_expression') {
      result = this.generateUnaryExpression(astNode, visitor);
    } else if (astNode.type === 'logical_expression') {
      result = this.generateLogicalExpression(astNode, visitor);
    } else if (astNode.type === 'comparison_expression') {
      result = this.generateComparisonExpression(astNode, visitor);
    } else if (astNode.type === 'bitwise_expression') {
      result = this.generateBitwiseExpression(astNode, visitor);
    } else if (astNode.type === 'update_expression') {
      result = this.generateUpdateExpression(astNode, context, visitor);
    } else if (astNode.type === 'assignment_expression') {
      result = this.generateAssignmentExpression(astNode, visitor);
    } else if (astNode.type === 'expression' && astNode.value) {
      return this.handleExpressionType(astNode, context, visitor);
    }
    
    // ⭐⭐ FIX: Don't automatically add parentheses for unary operators
    if (result && this.expressionNeedsParentheses(astNode)) {
      // Check if this is a unary expression (already has proper formatting)
      if (astNode.type === 'unary_expression' || 
          (astNode.type === 'bitwise_expression' && astNode.operator === '~')) {
        return result; // Skip adding extra parentheses
      }
      
      if (!result.startsWith('(') && !result.endsWith(')')) {
        result = `(${result})`;
      }
    }
    
    return result || '';
  }

  generateBitwiseExpression(node, visitor) {
    console.log(`DEBUG COperatorsGenerator: Generating bitwise expression with operator: ${node.operator}`);
    
    // Check if this is a unary bitwise NOT (~)
    if (node.operator === '~') {
      // This is a unary operator - handle it differently
      if (node.operand) {
        const operand = this.generateExpressionPart(node.operand, visitor);
        return `~${operand}`; // ⭐ FIX: Single ~, no parentheses here
      } else if (node.left) {
        const operand = this.generateExpressionPart(node.left, visitor);
        return `~${operand}`; // ⭐ FIX: Single ~
      } else {
        const originalText = node._position?.originalText || '';
        console.log(`DEBUG COperatorsGenerator: Bitwise NOT original text: "${originalText}"`);
        
        if (originalText.startsWith('~')) {
          const operand = originalText.substring(1).trim();
          return `~${operand}`; // ⭐ FIX: Single ~
        }
        return `~ `; // Last resort fallback
      }
    }
    
    // Handle binary bitwise operators (&, |, ^, <<, >>)
    const left = this.generateExpressionPart(node.left, visitor);
    const right = this.generateExpressionPart(node.right, visitor);
    const operator = this.mapCOperatorToJava(node.operator);
    
    return `${left} ${operator} ${right}`;
  }

  generateUpdateExpression(node, context, visitor) {
    console.log(`DEBUG COperatorsGenerator: Generating update expression:`, node);
    
    const text = node._position?.originalText || '';
    console.log(`DEBUG COperatorsGenerator: Update expression text: "${text}"`);
    
    if (text.includes('++') || text.includes('--')) {
      const isPrefix = text.startsWith('++') || text.startsWith('--');
      const isPostfix = text.endsWith('++') || text.endsWith('--');
      
      let variableName = '';
      let operator = '';
      
      if (isPrefix) {
        operator = text.substring(0, 2);
        variableName = text.substring(2);
      } else if (isPostfix) {
        variableName = text.substring(0, text.length - 2);
        operator = text.substring(text.length - 2);
      } else {
        if (node.operand && node.operand.name) {
          variableName = node.operand.name;
        } else if (node.operator && node.operator !== 'i') {
          variableName = node.operator;
        }
        
        if (text.includes('++')) {
          operator = '++';
        } else if (text.includes('--')) {
          operator = '--';
        }
      }
      
      variableName = variableName.trim();
      
      if (isPrefix) {
        return `${operator}${variableName}`;
      } else {
        return `${variableName}${operator}`;
      }
    }
    
    if (node.operator === 'i' && node.operand && node.operand.value === '++') {
      return 'i++';
    }
    
    if (node.operand) {
      const operand = this.generateExpressionPart(node.operand, visitor);
      let operator = this.mapCOperatorToJava(node.operator);
      
      if (operator === 'i' || operator === '++' || operator === '--') {
        operator = text.includes('++') ? '++' : 
                   text.includes('--') ? '--' : operator;
      }
      
      return `${operand}${operator}`;
    }
    
    return text || 'i++';
  }

  generateAssignmentExpression(node, visitor) {
    const left = this.generateExpressionPart(node.left, visitor);
    const right = this.generateExpressionPart(node.right, visitor);
    const operator = this.mapCOperatorToJava(node.operator) || '=';
    
    return `${left} ${operator} ${right}`;
  }

  handleExpressionType(astNode, context, visitor) {
    const value = astNode.value.toString();
    
    if (value.includes('printf(')) {
      return this.convertPrintfToJava(value, astNode);
    }
    
    if (value.includes('?') && value.includes(':')) {
      return this.convertTernaryExpression(value, astNode);
    }
    
    if (this.expressionNeedsParentheses(astNode)) {
      return `(${value})`;
    }
    return value;
  }

  convertPrintfToJava(printfText, astNode) {
    console.log(`DEBUG COperatorsGenerator: Converting printf to Java: ${printfText}`);
    
    const match = printfText.match(/printf\("([^"]*)"\)/);
    if (match) {
      const message = match[1];
      const cleanMessage = message.replace(/\\n/g, '');
      return `System.out.println("${cleanMessage}");`;
    }
    
    const match2 = printfText.match(/printf\('([^']*)'\)/);
    if (match2) {
      const message = match2[1];
      const cleanMessage = message.replace(/\\n/g, '');
      return `System.out.println("${cleanMessage}");`;
    }
    
    const quoteMatch = printfText.match(/["']([^"']*)["']/);
    if (quoteMatch) {
      const message = quoteMatch[1];
      const cleanMessage = message.replace(/\\n/g, '');
      return `System.out.println("${cleanMessage}");`;
    }
    
    return `${printfText}`;
  }

  convertTernaryExpression(exprText, astNode) {
    return `(${exprText})`;
  }

  generateBinaryExpression(node, visitor) {
    const left = this.generateExpressionPart(node.left, visitor);
    const right = this.generateExpressionPart(node.right, visitor);
    const operator = this.mapCOperatorToJava(node.operator);
    
    return `${left} ${operator} ${right}`;
  }

  generateUnaryExpression(node, visitor) {
    const operand = this.generateExpressionPart(node.operand, visitor);
    const operator = this.mapCOperatorToJava(node.operator);
    
    if (node.operator === '++' || node.operator === '--') {
      const text = node._position?.originalText || '';
      if (text.startsWith(node.operator)) {
        return `${operator}${operand}`;
      } else {
        return `${operand}${operator}`;
      }
    }
    
    return `${operator}${operand}`; // ⭐ This will generate "!x" for logical NOT
  }

  generateLogicalExpression(node, visitor) {
    const left = this.generateExpressionPart(node.left, visitor);
    const right = this.generateExpressionPart(node.right, visitor);
    const operator = this.mapCOperatorToJava(node.operator);
    
    return `${left} ${operator} ${right}`;
  }

  generateComparisonExpression(node, visitor) {
    const left = this.generateExpressionPart(node.left, visitor);
    const right = this.generateExpressionPart(node.right, visitor);
    const operator = this.mapCOperatorToJava(node.operator);
    
    return `${left} ${operator} ${right}`;
  }

  generateExpressionPart(expr, visitor) {
    if (!expr) return '';
    
    if (expr.type === 'literal') {
      return expr.value;
    } else if (expr.type === 'identifier') {
      return expr.name;
    } else if (expr.type === 'binary_expression' || 
               expr.type === 'unary_expression' ||
               expr.type === 'logical_expression' ||
               expr.type === 'comparison_expression' ||
               expr.type === 'bitwise_expression' ||
               expr.type === 'update_expression' ||
               expr.type === 'assignment_expression' ||
               expr.type === 'expression') {
      return this.generate(expr, {}, visitor);
    }
    
    return '';
  }

  mapCOperatorToJava(cOperator) {
    const operatorMap = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%',
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      '&&': '&&',
      '||': '||',
      '!': '!',
      '&': '&',
      '|': '|',
      '^': '^',
      '~': '~',
      '<<': '<<',
      '>>': '>>',
      '++': '++',
      '--': '--',
      '=': '=',
      '+=': '+=',
      '-=': '-=',
      '*=': '*=',
      '/=': '/=',
      '%=': '%='
    };
    
    return operatorMap[cOperator] || cOperator;
  }

  generateExpression(expr, visitor) {
    if (!expr) return '';
    
    if (expr.type === 'literal') {
      return expr.value;
    } else if (expr.type === 'identifier') {
      return expr.name;
    } else if (expr.type === 'binary_expression' || 
               expr.type === 'comparison_expression' ||
               expr.type === 'logical_expression' ||
               expr.type === 'bitwise_expression') {
      
      // ⭐⭐ FIX: Handle bitwise NOT with single ~ and no extra parentheses
      if (expr.type === 'bitwise_expression' && expr.operator === '~') {
        if (expr.left) {
          const operand = this.generateExpression(expr.left, visitor);
          return `~${operand}`; // ⭐ FIX: Single ~
        } else if (expr.operand) {
          const operand = this.generateExpression(expr.operand, visitor);
          return `~${operand}`; // ⭐ FIX: Single ~
        }
      }
      
      const left = this.generateExpression(expr.left, visitor);
      const right = this.generateExpression(expr.right, visitor);
      const operator = this.mapCOperatorToJava(expr.operator);
      
      const expression = `${left} ${operator} ${right}`;
      if (this.expressionNeedsParentheses(expr)) {
        return `(${expression})`;
      }
      return expression;
    } else if (expr.type === 'unary_expression') {
      const operand = this.generateExpression(expr.operand, visitor);
      const operator = this.mapCOperatorToJava(expr.operator);
      return `${operator}${operand}`; // ⭐ Will generate "!x" or "~m"
    } else if (expr.type === 'update_expression') {
      return this.generateUpdateExpression(expr, {}, visitor);
    } else if (expr.type === 'assignment_expression') {
      const left = this.generateExpression(expr.left, visitor);
      const right = this.generateExpression(expr.right, visitor);
      return `${left} = ${right}`;
    }
    
    return expr.value || '';
  }

  expressionNeedsParentheses(node) {
    if (!node) return false;
    
    if (node.type === 'literal' || node.type === 'identifier') {
      return false;
    }
    
    if (node.type === 'update_expression') {
      return false;
    }
    
    if (node.type === 'assignment_expression') {
      return false;
    }
    
    // ⭐ FIX: Don't add parentheses for unary operators
    if (node.type === 'unary_expression') {
      return false;
    }
    
    // ⭐ FIX: Don't add parentheses for bitwise NOT
    if (node.type === 'bitwise_expression' && node.operator === '~') {
      return false;
    }
    
    const simpleComparison = ['==', '!=', '<', '>', '<=', '>='];
    const simpleArithmetic = ['+', '-', '*', '/', '%'];
    
    if (node.operator && (simpleComparison.includes(node.operator) || 
                          simpleArithmetic.includes(node.operator))) {
      return false;
    }
    
    return false;
  }
}

export default {
  generate: function(node, context, visitor) {
    const generator = new COperatorsGenerator();
    return generator.generate(node, context, visitor);
  }
};