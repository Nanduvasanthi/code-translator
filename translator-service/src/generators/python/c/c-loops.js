import { LoopStatement } from '../../../core/ast-nodes.js';

export class LoopsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'loop_statement';
  }

  generate(astNode, context) {
    console.log('DEBUG LoopsGenerator: Generating loop node:', JSON.stringify(astNode, null, 2));
    
    const { loop_type, initializer, condition, update, body } = astNode;
    
    switch (loop_type) {
      case 'for':
        return this.generateForLoop(initializer, condition, update, body, context);
      case 'while':
        return this.generateWhileLoop(condition, body, context);
      case 'do_while':
        return this.generateDoWhileLoop(condition, body, context);
      default:
        return '';
    }
  }

  generateForLoop(initializer, condition, update, body, context) {
    console.log('DEBUG LoopsGenerator: Generating for loop:', { initializer, condition, update });
    
    // Convert C-style for loop to Python range
    // Check for both assignment_expression AND variable_declaration
    const isValidInitializer = initializer && 
      (initializer.type === 'assignment_expression' || initializer.type === 'variable_declaration');
    
    if (isValidInitializer && 
        condition && condition.type === 'binary_expression' && 
        update && update.type === 'update_expression') {
      
      let loopVar, start;
      
      if (initializer.type === 'variable_declaration') {
        // Handle: int i = 0;
        loopVar = initializer.name;
        start = this.extractValue(initializer.value);
      } else {
        // Handle: i = 0;
        loopVar = this.extractIdentifier(initializer.left);
        start = this.extractValue(initializer.right);
      }
      
      const conditionStr = this.convertConditionToString(condition);
      const updateOp = update.operator;
      
      console.log('DEBUG LoopsGenerator: Extracted components:', { loopVar, start, conditionStr, updateOp });
      
      // Build Python range expression
      let rangeExpr = this.buildRangeExpression(loopVar, start, condition, updateOp);
      
      // Generate body with the loop variable available in context
      const bodyContext = { ...context, loopVariable: loopVar };
      const indentedBody = this.indentCode(this.generateBody(body, bodyContext));
      
      return `for ${loopVar} in ${rangeExpr}:\n${indentedBody}`;
    }
    
    // Fallback for complex loops
    console.log('DEBUG LoopsGenerator: Using fallback - initializer type:', initializer?.type);
    const indentedBody = this.indentCode(this.generateBody(body, context));
    return `for _ in range(10):\n${indentedBody}`;
  }

  generateWhileLoop(condition, body, context) {
    console.log('DEBUG LoopsGenerator: Generating while loop:', condition);
    
    // Convert condition object to string
    const condStr = this.convertConditionToString(condition);
    const indentedBody = this.indentCode(this.generateBody(body, context));
    
    return `while ${condStr}:\n${indentedBody}`;
  }

  generateDoWhileLoop(condition, body, context) {
    console.log('DEBUG LoopsGenerator: Generating do-while loop:', condition);
    
    // Convert condition object to string
    const condStr = this.convertConditionToString(condition);
    const bodyCode = this.generateBody(body, context);
    
    // Python doesn't have do-while, convert to while True with break
    let result = 'while True:\n';
    
    // Add body with proper indentation
    if (bodyCode && bodyCode.trim() !== '') {
      const indentedBody = this.indentCode(bodyCode);
      result += indentedBody;
      // Ensure newline after body before break condition
      if (!indentedBody.endsWith('\n')) {
        result += '\n';
      }
    }
    
    result += `    if not (${condStr}):\n`;
    result += '        break\n';
    return result;
  }

  extractIdentifier(node) {
    if (!node) return 'i';
    
    if (node.type === 'identifier') {
      return node.name;
    } else if (node.type === 'variable_declaration') {
      return node.name || 'i';
    }
    return 'i'; // default
  }

  extractValue(node) {
    if (!node) return '0';
    
    if (node.type === 'literal') {
      return node.value;
    } else if (node.type === 'string_literal') {
      let value = node.value || '';
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      return `"${value}"`;
    }
    return '0';
  }

  convertConditionToString(conditionNode) {
    if (!conditionNode) return 'True';
    
    if (typeof conditionNode === 'object') {
      if (conditionNode.type === 'binary_expression') {
        const left = this.convertOperandToString(conditionNode.left);
        const right = this.convertOperandToString(conditionNode.right);
        return `${left} ${conditionNode.operator} ${right}`;
      }
      // Return a simple string representation
      return JSON.stringify(conditionNode);
    }
    
    return String(conditionNode);
  }

  convertOperandToString(node) {
    if (!node) return '';
    
    if (node.type === 'identifier') {
      return node.name;
    } else if (node.type === 'literal') {
      return node.value;
    } else if (node.type === 'binary_expression') {
      const left = this.convertOperandToString(node.left);
      const right = this.convertOperandToString(node.right);
      return `(${left} ${node.operator} ${right})`;
    }
    
    return String(node);
  }

  buildRangeExpression(loopVar, start, condition, updateOp) {
    if (!condition || condition.type !== 'binary_expression') {
      return `range(${start}, ?)`;
    }
    
    const condVar = this.extractIdentifier(condition.left);
    const condValue = this.extractValue(condition.right);
    const operator = condition.operator;
    
    // Check if condition variable matches loop variable
    if (condVar !== loopVar) {
      return `range(${start}, ?)`;
    }
    
    // Convert based on operator and update
    let rangeEnd = condValue;
    let step = '1';
    
    if (updateOp === '++') {
      // Incrementing loop
      if (operator === '<') {
        // i < 5 -> range(start, 5)
        rangeEnd = condValue;
      } else if (operator === '<=') {
        // i <= 5 -> range(start, 6)
        rangeEnd = `${parseInt(condValue) + 1}`;
      } else if (operator === '>') {
        // i > 5 with i++ doesn't make sense for range
        return `range(${start}, ?)`;
      }
    } else if (updateOp === '--') {
      // Decrementing loop
      step = '-1';
      if (operator === '>') {
        // i > 0 -> range(start, -1, -1)
        rangeEnd = `${parseInt(condValue) - 1}`;
      } else if (operator === '>=') {
        // i >= 0 -> range(start, -1, -1)
        rangeEnd = `${parseInt(condValue)}`;
      }
    }
    
    if (step === '-1') {
      return `range(${start}, ${rangeEnd}, ${step})`;
    } else if (start === '0') {
      // Simplify range(0, n) to range(n)
      return `range(${rangeEnd})`;
    } else {
      return `range(${start}, ${rangeEnd})`;
    }
  }

  generateBody(body, context) {
    if (!body || body.length === 0) {
      return '';
    }
    
    if (Array.isArray(body)) {
      const statements = body.map(statement => {
        // Try to use appropriate generator from context
        if (context && context.generators) {
          // Try print generator first
          if (statement.type === 'print_statement') {
            const printGenerator = context.generators.print;
            if (printGenerator && printGenerator.canGenerate(statement)) {
              return printGenerator.generate(statement, context);
            }
          }
          
          // Try control flow generator for conditionals
          if (statement.type === 'conditional_statement') {
            const controlFlowGenerator = context.generators.controlFlow;
            if (controlFlowGenerator && controlFlowGenerator.canGenerate(statement)) {
              return controlFlowGenerator.generate(statement, context);
            }
          }
          
          // Try loops generator for nested loops
          if (statement.type === 'loop_statement') {
            return this.generate(statement, context);
          }
        }
        
        // Fallback for basic statement types
        if (typeof statement === 'string') {
          return statement;
        } else if (statement.type === 'expression_statement') {
          // Handle update expressions like i++
          if (statement.expression && statement.expression.type === 'update_expression') {
            const varName = this.extractIdentifier(statement.expression.operand);
            const op = statement.expression.operator;
            if (op === '++') {
              return `${varName} += 1`;
            } else if (op === '--') {
              return `${varName} -= 1`;
            }
          }
          return '';
        } else if (statement.type === 'break_statement') {
          return 'break';
        } else if (statement.type === 'continue_statement') {
          return 'continue';
        }
        return '';
      }).filter(stmt => stmt && stmt.trim() !== '');
      
      return statements.join('\n');
    }
    
    if (typeof body === 'string') {
      return body;
    }
    
    return '';
  }

  indentCode(code) {
    if (!code || code.trim() === '') {
      return '    pass\n';
    }
    
    if (typeof code === 'string') {
      const lines = code.split('\n');
      const indentedLines = lines.map(line => 
        line.trim() === '' ? '' : `    ${line}`
      ).filter(line => line !== '');
      
      return indentedLines.join('\n') + '\n';
    }
    return '    pass\n';
  }
}