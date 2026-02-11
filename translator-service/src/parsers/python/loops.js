export class LoopsParser {
  canParse(node) {
    return node.type === 'for_statement' || node.type === 'while_statement';
  }

  parse(node, context) {
    if (node.type === 'for_statement') {
      return this.parseForLoop(node, context);
    } else if (node.type === 'while_statement') {
      return this.parseWhileLoop(node, context);
    }
    return null;
  }

  parseForLoop(node, context) {
    console.log('Parsing for loop:', node.text);
    
    let variable = null;
    let iterable = null;
    let body = [];
    
    // Extract parts from for statement
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'identifier' && !variable) {
        variable = child.text;
      } else if (child.type === 'call' && child.text.includes('range')) {
        iterable = this.parseRangeCall(child);
      } else if (child.type === 'identifier' && variable && !iterable) {
        // Second identifier is the iterable (e.g., fruits in for fruit in fruits)
        iterable = child.text;
      } else if (child.type === 'block') {
        body = this.extractBlock(child, context);
      }
    }
    
    console.log(`For loop: variable=${variable}, iterable=${iterable}, body=${body.length} statements`);
    
    return {
      type: 'loop_statement',
      loop_type: 'for',
      variable: variable,
      iterable: iterable,
      body: body
    };
  }

  parseRangeCall(node) {
    console.log('Parsing range call:', node.text);
    
    // Extract range arguments
    let args = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'argument_list') {
        for (let j = 0; j < child.childCount; j++) {
          const arg = child.child(j);
          if (arg.type === 'integer') {
            args.push(parseInt(arg.text));
          } else if (arg.type === 'identifier') {
            // Handle variables in range()
            args.push(arg.text);
          }
        }
      }
    }
    
    // Handle different range() calls
    if (args.length === 1) {
      return { type: 'range', start: 0, end: args[0] };
    } else if (args.length === 2) {
      return { type: 'range', start: args[0], end: args[1] };
    } else if (args.length === 3) {
      return { type: 'range', start: args[0], end: args[1], step: args[2] };
    }
    
    return { type: 'range', end: 5 }; // Default
  }

  parseWhileLoop(node, context) {
    console.log('Parsing while loop:', node.text);
    
    let condition = null;
    let body = [];
    
    // Extract condition from while statement
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'comparison_expression') {
        condition = this.parseCondition(child);
      } else if (child.type === 'binary_expression') {
        // Handle simple conditions like "count < 3"
        condition = this.parseBinaryExpression(child);
      } else if (child.type === 'block') {
        body = this.extractBlock(child, context);
      }
    }
    
    // If no condition found in children, try to parse from text
    if (!condition) {
      const match = node.text.match(/while\s+(.+?):/);
      if (match) {
        condition = {
          type: 'expression',
          value: match[1].trim()
        };
      }
    }
    
    console.log(`While loop: condition=${JSON.stringify(condition)}, body=${body.length} statements`);
    
    return {
      type: 'loop_statement',
      loop_type: 'while',
      condition: condition,
      body: body
    };
  }

  parseBinaryExpression(node) {
    let left = '';
    let operator = '';
    let right = '';
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'identifier') {
        left = child.text;
      } else if (child.type === 'comparison_operator' || child.type === 'binary_operator') {
        operator = child.text;
      } else if (child.type === 'integer') {
        right = child.text;
      } else if (child.type === 'identifier') {
        right = child.text;
      }
    }
    
    if (left && operator && right) {
      return {
        type: 'comparison',
        left: { type: 'variable', name: left },
        operator: operator,
        right: { type: 'number', value: right },
        expression: `${left} ${operator} ${right}`
      };
    }
    
    return {
      type: 'expression',
      value: node.text
    };
  }

  parseCondition(node) {
    if (node.type === 'comparison_expression') {
      let left = null;
      let operator = null;
      let right = null;
      
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        
        if (child.type === 'identifier') {
          left = child.text;
        } else if (child.type === 'comparison_operator') {
          operator = child.text;
        } else if (child.type === 'integer') {
          right = child.text;
        } else if (child.type === 'identifier') {
          right = child.text;
        }
      }
      
      if (left && operator && right) {
        return {
          type: 'comparison',
          left: { type: 'variable', name: left },
          operator: operator,
          right: { type: 'number', value: right },
          expression: `${left} ${operator} ${right}`
        };
      }
    }
    
    return {
      type: 'expression',
      value: node.text
    };
  }

  extractBlock(blockNode, context) {
    const statements = [];
    
    console.log('Extracting block with', blockNode.childCount, 'children');
    
    for (let i = 0; i < blockNode.childCount; i++) {
      const child = blockNode.child(i);
      console.log(`  Block child ${i}: ${child.type} = "${child.text}"`);
      
      if (child.type === 'expression_statement') {
        // Get the actual expression
        for (let j = 0; j < child.childCount; j++) {
          const expr = child.child(j);
          if (expr.type === 'assignment' || expr.type === 'call' || 
              expr.type === 'augmented_assignment' || expr.type === 'for_statement' ||
              expr.type === 'while_statement') {
            statements.push({
              type: 'raw',
              code: expr.text
            });
            break;
          }
        }
      } else if (child.type === 'assignment' || child.type === 'call' || 
                 child.type === 'augmented_assignment') {
        statements.push({
          type: 'raw',
          code: child.text
        });
      } else if (child.type === 'for_statement' || child.type === 'while_statement') {
        // Handle nested loops - parse them recursively
        const nestedLoop = this.parse(child, context);
        if (nestedLoop) {
          statements.push(nestedLoop);
        }
      }
    }
    
    return statements;
  }
}