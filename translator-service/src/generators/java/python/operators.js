export class OperatorsGenerator {
  canGenerate(astNode) {
    return astNode && astNode.type === 'operator';
  }

  generate(astNode, context) {
    const operator = astNode.operator;
    
    // Map Python operators to Java operators
    const operatorMap = {
      // Arithmetic
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%',
      '**': 'Math.pow', // Python power to Java Math.pow
      '//': '/', // Python floor division to Java integer division (for ints)
      
      // Comparison
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      
      // Logical
      'and': '&&',
      'or': '||',
      'not': '!'
    };
    
    const javaOperator = operatorMap[operator];
    if (javaOperator) {
      return javaOperator;
    }
    
    return operator; // fallback
  }
}