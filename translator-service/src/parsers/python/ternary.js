export class TernaryParser {
  canParse(node) {
    return node.type === 'conditional_expression';
  }

  parse(node, context) {
    console.log('=== TernaryParser parsing ===');
    console.log('Node type:', node.type, 'text:', node.text);
    
    let condition = null;
    let thenValue = null;
    let elseValue = null;
    
    // Debug: Show all children
    console.log('Node children:');
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      console.log(`  Child ${i}: ${child.type} = "${child.text}"`);
    }
    
    // NEW APPROACH: Parse the structure based on child positions
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'if') {
        // Value before 'if' is thenValue
        if (i > 0) {
          thenValue = this.parseValue(node.child(i - 1));
        }
        
        // Condition after 'if' (could be at i+1 or i+2)
        if (i + 1 < node.childCount) {
          const conditionNode = node.child(i + 1);
          console.log('Condition node:', conditionNode.type, conditionNode.text);
          
          if (conditionNode.type === 'comparison_operator') {
            // The entire comparison is in one token: "score >= 60"
            const conditionText = conditionNode.text;
            console.log('Parsing comparison operator text:', conditionText);
            
            // Parse the comparison text manually
            condition = this.parseComparisonText(conditionText);
          }
        }
      } else if (child.type === 'else') {
        // Value after 'else' is elseValue
        if (i + 1 < node.childCount) {
          elseValue = this.parseValue(node.child(i + 1));
        }
      }
    }
    
    console.log('Parsed ternary:', {
      condition: condition,
      thenValue: thenValue,
      elseValue: elseValue
    });
    
    return {
      type: 'ternary_expression',
      condition,
      thenValue,
      elseValue
    };
  }

  parseComparisonText(text) {
    console.log('Parsing comparison text:', text);
    
    // Parse expressions like "score >= 60"
    // Try to split by common comparison operators
    const operators = ['>=', '<=', '>', '<', '==', '!=', '===', '!=='];
    
    for (const op of operators) {
      if (text.includes(op)) {
        const parts = text.split(op);
        if (parts.length === 2) {
          const left = parts[0].trim();
          const right = parts[1].trim();
          
          console.log(`Found operator "${op}": left="${left}", right="${right}"`);
          
          return {
            type: 'comparison',
            left: { type: 'variable', name: left },
            operator: op,
            right: { type: 'number', value: right },
            expression: `${left} ${op} ${right}`
          };
        }
      }
    }
    
    // If no operator found, return as raw expression
    console.log('No operator found, returning as raw');
    return {
      type: 'raw',
      value: text
    };
  }

  parseValue(node) {
    if (node.type === 'string') {
      const text = node.text;
      // Remove quotes
      let value = text;
      if ((text.startsWith('"') && text.endsWith('"')) ||
          (text.startsWith("'") && text.endsWith("'"))) {
        value = text.substring(1, text.length - 1);
      }
      return {
        type: 'string',
        value: value
      };
    } else if (node.type === 'identifier') {
      return {
        type: 'variable',
        name: node.text
      };
    } else if (node.type === 'integer' || node.type === 'float') {
      return {
        type: 'number',
        value: node.text
      };
    } else if (node.type === 'true') {
      return {
        type: 'boolean',
        value: true
      };
    } else if (node.type === 'false') {
      return {
        type: 'boolean',
        value: false
      };
    }
    
    console.log('Unknown value type:', node.type, node.text);
    return null;
  }

  // Keep the old method for reference but update it
  extractComparison(node) {
    console.log('Extracting comparison from node:', node.type, node.text);
    
    // Check if it's already a comparison_operator with the full expression
    if (node.type === 'comparison_operator') {
      return this.parseComparisonText(node.text);
    }
    
    let left = '';
    let operator = '';
    let right = '';
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'identifier') {
        left = child.text;
      } else if (child.type === 'comparison_operator') {
        operator = child.text;
      } else if (child.type === 'integer' || child.type === 'float') {
        right = child.text;
      }
    }
    
    if (left && operator && right) {
      return {
        type: 'comparison',
        left: left,
        operator: operator,
        right: right,
        expression: `${left} ${operator} ${right}`
      };
    }
    
    // If we can't parse it, return the text as raw
    return {
      type: 'raw',
      value: node.text
    };
  }
}