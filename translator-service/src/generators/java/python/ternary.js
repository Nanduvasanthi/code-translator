export class TernaryGenerator {
  canGenerate(astNode) {
    return astNode && astNode.type === 'ternary_expression';
  }

  generate(astNode, context) {
    const { condition, thenValue, elseValue } = astNode;
    
    const cond = this.expressionToJava(condition, context);
    const thenVal = this.valueToJava(thenValue, context);
    const elseVal = this.valueToJava(elseValue, context);
    
    // Generate proper Java ternary expression
    return `(${cond} ? ${thenVal} : ${elseVal})`;
  }

  expressionToJava(expr, context) {
    if (!expr) {
      console.log('Warning: No expression in ternary');
      return 'true';
    }
    
    console.log('Generating expression:', expr.type, expr);
    
    switch (expr.type) {
      case 'comparison':
        const left = this.valueToJava(expr.left, context);
        const right = this.valueToJava(expr.right, context);
        return `${left} ${expr.operator} ${right}`;
      
      case 'expression':
        return expr.value || 'true';
      
      default:
        console.log('Unknown expression type:', expr.type);
        return 'true';
    }
  }

  valueToJava(value, context) {
    if (!value) {
      console.log('Warning: No value in ternary');
      return '';
    }
    
    console.log('Generating value:', value.type, value);
    
    switch (value.type) {
      case 'string':
        return `"${value.value}"`;
      
      case 'variable':
        return value.name;
      
      case 'number':
        return value.value;
      
      case 'literal':
        // Handle literal values from variable parser
        if (typeof value.value === 'string') {
          return `"${value.value}"`;
        } else if (typeof value.value === 'boolean') {
          return value.value ? 'true' : 'false';
        } else {
          return value.value;
        }
      
      default:
        console.log('Unknown value type:', value.type);
        return '';
    }
  }
}