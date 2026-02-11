// Since there's no ConditionalExpression in ast-nodes, we'll handle ternary separately
export class JavaTernaryGenerator {
  constructor() {
    console.log('✅ C JavaTernaryGenerator initialized');
  }

  canGenerate(astNode) {
    // Handle ternary expressions that might come from parsers
    return astNode.type === 'ternary_expression' || 
           astNode.type === 'conditional_expression';
  }

  generate(astNode, context) {
    if (!this.canGenerate(astNode)) {
      console.warn(`JavaTernaryGenerator cannot generate node type: ${astNode.type}`);
      return '';
    }

    console.log(`JavaTernaryGenerator processing ternary expression`);

    // Extract condition, true expression, and false expression
    const condition = astNode.condition || '0';
    const trueExpr = astNode.true_expression || '0';
    const falseExpr = astNode.false_expression || '0';

    return `(${condition} ? ${trueExpr} : ${falseExpr})`;
  }
}