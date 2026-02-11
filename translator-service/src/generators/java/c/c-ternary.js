// generators/java/c-ternary.js - C TO JAVA TERNARY OPERATOR GENERATOR
export class CTernaryGenerator {
  generate(astNode, context = {}, visitor) {
    if (!astNode || astNode.type !== 'ternary_expression') {
      return '';
    }
    
    const condition = this.generateExpression(astNode.condition, visitor);
    const thenValue = this.generateExpression(astNode.thenValue, visitor);
    const elseValue = this.generateExpression(astNode.elseValue, visitor);
    
    return `(${condition}) ? (${thenValue}) : (${elseValue})`;
  }

  generateExpression(expr, visitor) {
    if (!expr) return '';
    
    // Use the operators generator
    if (visitor.generators?.operators) {
      const gen = visitor.generators.operators;
      let generated = '';
      
      if (typeof gen === 'function') {
        generated = gen(expr, {}, visitor);
      } else if (gen.generate && typeof gen.generate === 'function') {
        generated = gen.generate(expr, {}, visitor);
      } else if (gen.default && gen.default.generate && typeof gen.default.generate === 'function') {
        generated = gen.default.generate(expr, {}, visitor);
      }
      
      return generated || expr.value || '';
    }
    
    return expr.value || '';
  }
}

export default {
  generate: function(node, context, visitor) {
    const generator = new CTernaryGenerator();
    return generator.generate(node, context, visitor);
  }
};