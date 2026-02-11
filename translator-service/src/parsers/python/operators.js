import { BinaryExpression } from '../../core/ast-nodes.js';

export class OperatorsParser {
  canParse(node) {
    const binaryOps = [
      '+', '-', '*', '/', '%', '**', '//',
      '==', '!=', '<', '>', '<=', '>=',
      'and', 'or'
    ];
    
    if (node.type === 'binary_operator') {
      return binaryOps.includes(node.text);
    }
    
    if (node.type === 'comparison_operator') {
      return true;
    }
    
    return false;
  }

  parse(node) {
    if (node.type === 'binary_operator') {
      return {
        type: 'operator',
        operator: node.text,
        isBinary: true
      };
    }
    
    if (node.type === 'comparison_operator') {
      return {
        type: 'operator',
        operator: node.text,
        isComparison: true
      };
    }
    
    // Handle unary operators like 'not'
    if (node.type === 'not') {
      return {
        type: 'operator',
        operator: 'not',
        isUnary: true
      };
    }
    
    return null;
  }
}