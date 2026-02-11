import { VariableDeclaration } from '../../core/ast-nodes.js';

export class VariablesParser {
  canParse(node) {
    return node.type === 'assignment';
  }

  parse(node, context) {
    // Extract variable name (first identifier child)
    let name = '';
    let valueNode = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'identifier' && !name) {
        name = child.text;
      } else if (child.type !== '=' && child.type !== 'identifier' && !valueNode) {
        valueNode = child;
      }
    }
    
    let value = null;
    let type = 'Object';
    
    if (valueNode) {
      if (valueNode.type === 'integer') {
        value = { type: 'literal', value: parseInt(valueNode.text), data_type: 'int' };
        type = 'int';
      } else if (valueNode.type === 'float') {
        value = { type: 'literal', value: parseFloat(valueNode.text), data_type: 'float' };
        type = 'float';
      } else if (valueNode.type === 'string') {
        const text = valueNode.text;
        value = { 
          type: 'literal', 
          value: this.cleanString(text), 
          data_type: 'str' 
        };
        type = 'str';
      } else if (valueNode.type === 'true') {
        value = { type: 'literal', value: true, data_type: 'bool' };
        type = 'bool';
      } else if (valueNode.type === 'false') {
        value = { type: 'literal', value: false, data_type: 'bool' };
        type = 'bool';
      } else if (valueNode.type === 'conditional_expression') {
        // Handle ternary expressions
        // Get the ternary parser from context
        const ternaryParser = context.getParser('ternary');
        if (ternaryParser && ternaryParser.canParse(valueNode)) {
          value = ternaryParser.parse(valueNode, context);
          value.type = 'ternary_expression';
          
          // Infer type from ternary branches
          type = this.inferTernaryType(value.thenValue, value.elseValue);
        }
      } else if (valueNode.type === 'identifier') {
        // Variable assignment from another variable
        value = { type: 'identifier', name: valueNode.text, data_type: 'object' };
        
        // Try to infer type from context
        const varType = context.getVariableType(valueNode.text);
        if (varType) {
          type = varType;
        }
      }
    }
    
    context.addVariable(name, type);
    return new VariableDeclaration(name, type, value);
  }

  cleanString(text) {
    if ((text.startsWith('"') && text.endsWith('"')) ||
        (text.startsWith("'") && text.endsWith("'"))) {
      return text.substring(1, text.length - 1);
    }
    return text;
  }

  inferTernaryType(thenValue, elseValue) {
    if (!thenValue || !elseValue) return 'Object';
    
    const thenType = this.getValueType(thenValue);
    const elseType = this.getValueType(elseValue);
    
    // If both are same type
    if (thenType === elseType) {
      return thenType;
    }
    
    // Mixed types - return Object
    return 'Object';
  }

  getValueType(value) {
    if (!value) return 'Object';
    
    if (value.type === 'string' || (value.type === 'literal' && typeof value.value === 'string')) {
      return 'str';
    } else if (value.type === 'number' || (value.type === 'literal' && typeof value.value === 'number')) {
      // Check if it's integer or float
      if (typeof value.value === 'number') {
        return Number.isInteger(value.value) ? 'int' : 'float';
      }
      return 'int'; // default to int
    } else if (value.type === 'variable') {
      return 'Object'; // Can't know without context
    }
    
    return 'Object';
  }
}