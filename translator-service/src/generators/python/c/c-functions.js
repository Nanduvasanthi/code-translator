import { FunctionDeclaration, CallExpression, ReturnStatement } from '../../../core/ast-nodes.js';

export class FunctionsGenerator {
  canGenerate(astNode) {
    return ['function_declaration', 'call_expression', 'return_statement'].includes(astNode.type);
  }

  generate(astNode, context) {
    switch (astNode.type) {
      case 'call_expression':
        return this.generateCallExpression(astNode, context);
      case 'return_statement':
        return this.generateReturnStatement(astNode, context);
      default:
        return '';
    }
  }

  generateCallExpression(astNode, context) {
    const { function_name, arguments: args } = astNode;
    
    // Handle specific C functions
    if (function_name === 'printf') {
      // This should be handled by the print generator
      return '';
    }
    
    // Convert arguments
    const pyArgs = args.map(arg => {
      // Handle string formatting removal
      if (typeof arg === 'string' && arg.includes('%')) {
        return arg.replace(/%[^%]/g, '{}');
      }
      return arg;
    });
    
    return `${function_name}(${pyArgs.join(', ')})`;
  }

  generateReturnStatement(astNode, context) {
    const { value } = astNode;
    return `return ${value || ''}`;
  }
}