export class OperatorsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'binary_expression' || 
           astNode.type === 'unary_expression' ||
           astNode.type === 'comparison_expression' ||
           astNode.type === 'logical_expression';
  }

  generate(astNode, context) {
    switch (astNode.type) {
      case 'binary_expression':
        return this.generateBinaryExpression(astNode, context);
      case 'unary_expression':
        return this.generateUnaryExpression(astNode, context);
      case 'comparison_expression':
        return this.generateComparisonExpression(astNode, context);
      case 'logical_expression':
        return this.generateLogicalExpression(astNode, context);
      default:
        return '0';
    }
  }

  generateBinaryExpression(astNode, context) {
    const left = this.generateOperand(astNode.left, context);
    const right = this.generateOperand(astNode.right, context);
    const operator = this.mapOperator(astNode.operator);
    
    // Special handling for power operator
    if (astNode.operator === '**') {
      return `pow(${left}, ${right})`;
    }
    
    // Handle integer division
    if (astNode.operator === '//') {
      // In C, integer division with integers is already floor division
      // But we need to handle float case too
      return `(int)(${left} / ${right})`;
    }
    
    return `(${left} ${operator} ${right})`;
  }

  generateUnaryExpression(astNode, context) {
    const operand = this.generateOperand(astNode.operand, context);
    const operator = this.mapOperator(astNode.operator);
    
    if (astNode.operator === 'not') {
      return `!(${operand})`;
    }
    
    return `${operator}${operand}`;
  }

  generateComparisonExpression(astNode, context) {
    const left = this.generateOperand(astNode.left, context);
    const right = this.generateOperand(astNode.right, context);
    const operator = this.mapOperator(astNode.operator);
    
    return `(${left} ${operator} ${right})`;
  }

  generateLogicalExpression(astNode, context) {
    const left = this.generateOperand(astNode.left, context);
    const right = this.generateOperand(astNode.right, context);
    const operator = this.mapOperator(astNode.operator);
    
    return `(${left} ${operator} ${right})`;
  }

  generateOperand(operand, context) {
    if (!operand) return '0';
    
    if (typeof operand === 'object') {
      if (operand.type === 'variable') {
        return operand.name;
      } else if (operand.type === 'number') {
        return operand.value;
      } else if (operand.type === 'string') {
        return `"${operand.value}"`;
      } else if (operand.type === 'boolean') {
        return operand.value ? 'true' : 'false';
      } else if (operand.type === 'binary_expression' ||
                 operand.type === 'unary_expression' ||
                 operand.type === 'comparison_expression' ||
                 operand.type === 'logical_expression') {
        return this.generate(operand, context);
      } else if (operand.type === 'literal') {
        // Handle literals from variable parser
        return this.convertLiteralToC(operand, context);
      }
    }
    
    // If it's a primitive value
    if (typeof operand === 'string' || typeof operand === 'number' || typeof operand === 'boolean') {
      return this.convertPrimitiveToC(operand, context);
    }
    
    return '0';
  }

  convertLiteralToC(literal, context) {
    if (!literal) return '0';
    
    if (literal.data_type === 'str') {
      return `"${literal.value || ''}"`;
    } else if (literal.data_type === 'int') {
      return literal.value?.toString() || '0';
    } else if (literal.data_type === 'float') {
      const val = literal.value?.toString() || '0.0';
      return val.includes('.') ? val : val + '.0';
    } else if (literal.data_type === 'bool') {
      context.markNeedsStdbool?.();
      return literal.value ? 'true' : 'false';
    }
    
    return '0';
  }

  convertPrimitiveToC(value, context) {
    if (typeof value === 'string') {
      return `"${value}"`;
    } else if (typeof value === 'boolean') {
      context.markNeedsStdbool?.();
      return value ? 'true' : 'false';
    } else if (typeof value === 'number') {
      return value.toString();
    }
    return value;
  }

  mapOperator(pythonOp) {
    const operatorMap = {
      // Arithmetic
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%',
      '**': '**', // Special handling in generateBinaryExpression
      '//': '/',  // Special handling in generateBinaryExpression
      
      // Comparison
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      'is': '==',
      'is not': '!=',
      
      // Logical
      'and': '&&',
      'or': '||',
      'not': '!'
    };
    
    return operatorMap[pythonOp] || pythonOp;
  }
}