export class BaseParser {
  constructor() {
    this.supportedTypes = ['assignment', 'function_definition', 'if_statement', 
                          'for_statement', 'while_statement', 'list', 'call', 
                          'comment', 'binary_operator'];
  }

  canParse(node) {
    return false;
  }

  parse(node, context) {
    throw new Error('parse() must be implemented by subclass');
  }

  inferType(valueNode) {
    if (!valueNode) return 'Object';
    
    if (valueNode.type === 'integer') return 'int';
    if (valueNode.type === 'float') return 'float';
    if (valueNode.type === 'string') return 'String';
    if (valueNode.type === 'true' || valueNode.type === 'false') return 'boolean';
    if (valueNode.type === 'identifier') return 'Object';
    if (valueNode.type === 'list') return 'ArrayList';
    
    return 'Object';
  }

  parseExpression(node) {
    if (!node) return null;
    
    if (node.type === 'integer') {
      return { type: 'literal', value: parseInt(node.text), data_type: 'int' };
    } else if (node.type === 'float') {
      return { type: 'literal', value: parseFloat(node.text), data_type: 'float' };
    } else if (node.type === 'string') {
      return { type: 'literal', value: node.text.slice(1, -1), data_type: 'String' };
    } else if (node.type === 'true' || node.type === 'false') {
      return { type: 'literal', value: node.text === 'true', data_type: 'boolean' };
    } else if (node.type === 'identifier') {
      return { type: 'identifier', name: node.text };
    } else if (node.type === 'binary_operator') {
      return {
        type: 'binary_operation',
        operator: node.operator?.text || '',
        left: this.parseExpression(node.left),
        right: this.parseExpression(node.right)
      };
    }
    
    return { type: 'expression', value: node.text };
  }
}