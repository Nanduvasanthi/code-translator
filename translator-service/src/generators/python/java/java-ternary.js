export class TernaryGenerator {
  canGenerate(astNode) {
    return astNode.type === 'ternary_expression';
  }

  generate(astNode, context) {
    const condition = this.generateExpression(astNode.condition, context);
    const thenValue = this.generateExpression(astNode.thenValue, context);
    const elseValue = this.generateExpression(astNode.elseValue, context);
    
    return `${thenValue} if ${condition} else ${elseValue}`;
  }

  generateExpression(expr, context) {
    if (expr.type === 'literal') {
      if (typeof expr.value === 'string') {
        return `"${expr.value}"`;
      } else if (expr.data_type === 'boolean') {
        return expr.value ? 'True' : 'False';
      }
      return String(expr.value);
    } else if (expr.type === 'identifier') {
      return expr.name;
    }
    return 'None';
  }
}