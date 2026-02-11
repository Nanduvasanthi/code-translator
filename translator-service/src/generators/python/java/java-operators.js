export class OperatorsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'binary_expression' || 
           astNode.type === 'unary_expression' ||
           astNode.type === 'assignment_expression';
  }

  generate(astNode, context) {
    switch (astNode.type) {
      case 'binary_expression':
        return this.generateBinaryExpression(astNode, context);
      case 'unary_expression':
        return this.generateUnaryExpression(astNode, context);
      case 'assignment_expression':
        return this.generateAssignment(astNode, context);
      default:
        return '';
    }
  }

  generateBinaryExpression(astNode, context) {
    const left = this.generateOperand(astNode.left, context);
    const right = this.generateOperand(astNode.right, context);
    const operator = this.mapOperator(astNode.operator);
    
    return `${left} ${operator} ${right}`;
  }

  generateUnaryExpression(astNode, context) {
    const operand = this.generateOperand(astNode.operand, context);
    const operator = astNode.operator;
    
    if (operator === '!') {
      return `not ${operand}`;
    } else if (operator === '-') {
      return `-${operand}`;
    } else if (operator === '~') {
      return `~${operand}`;
    }
    
    return `${operator}${operand}`;
  }

  generateAssignment(astNode, context) {
    const indent = context.getIndent();
    const left = this.generateOperand(astNode.left, context);
    const right = this.generateOperand(astNode.right, context);
    
    if (astNode.operator === '=') {
      return `${indent}${left} = ${right}`;
    } else {
      // Compound assignment (e.g., +=, -=)
      const baseOp = astNode.operator.slice(0, -1); // Remove '='
      const pythonOp = this.mapOperator(baseOp);
      return `${indent}${left} ${pythonOp}= ${right}`;
    }
  }

  generateOperand(operand, context) {
    if (operand.type === 'literal') {
      if (typeof operand.value === 'string') {
        return `"${operand.value}"`;
      } else if (operand.data_type === 'boolean') {
        return operand.value ? 'True' : 'False';
      }
      return String(operand.value);
    } else if (operand.type === 'identifier') {
      return operand.name;
    } else if (operand.type === 'binary_expression') {
      return this.generateBinaryExpression(operand, context);
    } else if (operand.type === 'array_access') {
      return `${operand.array}[${this.generateOperand(operand.index, context)}]`;
    }
    
    return 'None';
  }

  mapOperator(javaOperator) {
    const operatorMap = {
      '&&': 'and',
      '||': 'or',
      '==': '==',
      '!=': '!=',
      '>': '>',
      '<': '<',
      '>=': '>=',
      '<=': '<=',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '//',
      '%': '%',
      '++': '+= 1',
      '--': '-= 1'
    };
    
    return operatorMap[javaOperator] || javaOperator;
  }
}