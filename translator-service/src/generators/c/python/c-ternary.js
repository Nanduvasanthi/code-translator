export class TernaryGenerator {
  canGenerate(astNode) {
    return astNode.type === 'ternary_expression';
  }

  generate(astNode, context) {
    const condition = this.generateCondition(astNode.condition, context);
    const thenValue = this.generateValue(astNode.thenValue, context);
    const elseValue = this.generateValue(astNode.elseValue, context);
    
    return `(${condition}) ? (${thenValue}) : (${elseValue})`;
  }

  generateCondition(condition, context) {
    if (!condition) return '0';
    
    if (condition.type === 'comparison') {
      const left = this.generateOperand(condition.left, context);
      const operator = this.mapOperator(condition.operator);
      const right = this.generateOperand(condition.right, context);
      
      return `(${left} ${operator} ${right})`;
    } else if (condition.type === 'raw') {
      // Parse raw expression
      return this.parseRawExpression(condition.value, context);
    }
    
    return '0';
  }

  generateValue(valueNode, context) {
    if (!valueNode) return '0';
    
    if (valueNode.type === 'string') {
      return `"${valueNode.value}"`;
    } else if (valueNode.type === 'variable') {
      return valueNode.name;
    } else if (valueNode.type === 'number') {
      return valueNode.value;
    } else if (valueNode.type === 'boolean') {
      return valueNode.value ? 'true' : 'false';
    }
    
    return '0';
  }

  generateOperand(operand, context) {
    if (!operand) return '0';
    
    if (typeof operand === 'object') {
      if (operand.type === 'variable') {
        return operand.name;
      } else if (operand.type === 'number') {
        return operand.value;
      }
    } else if (typeof operand === 'string') {
      return operand;
    }
    
    return '0';
  }

  parseRawExpression(expr, context) {
    expr = expr.trim();
    
    // Replace Python operators with C operators
    expr = expr.replace(/\b(and)\b/g, '&&');
    expr = expr.replace(/\b(or)\b/g, '||');
    expr = expr.replace(/\b(not)\b/g, '!');
    expr = expr.replace(/\b(is)\b/g, '==');
    expr = expr.replace(/\b(is not)\b/g, '!=');
    
    return expr;
  }

  mapOperator(pythonOp) {
    const operatorMap = {
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      'is': '==',
      'is not': '!='
    };
    
    return operatorMap[pythonOp] || pythonOp;
  }
}