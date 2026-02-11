import { ConditionalStatement } from '../../../core/ast-nodes.js';

export class ControlFlowGenerator {
  canGenerate(astNode) {
    return astNode.type === 'conditional_statement';
  }

  generate(astNode, context) {
    const { condition, then_branch, else_branch, else_if_branches } = astNode;
    
    // Convert condition using operators generator
    const conditionStr = this.convertExpression(condition, context);
    
    let result = `if ${conditionStr}:\n`;
    
    // Add then branch with indentation
    if (then_branch && Array.isArray(then_branch)) {
      const thenCode = this.convertBranch(then_branch, context);
      result += thenCode;
    } else {
      result += '    pass\n';
    }
    
    // Add elif branches
    if (else_if_branches && Array.isArray(else_if_branches)) {
      for (const elif of else_if_branches) {
        if (!elif || !elif.condition) continue;
        
        const elifConditionStr = this.convertExpression(elif.condition, context);
        result += `elif ${elifConditionStr}:\n`;
        
        if (elif.then_branch && Array.isArray(elif.then_branch)) {
          result += this.convertBranch(elif.then_branch, context);
        } else {
          result += '    pass\n';
        }
      }
    }
    
    // Add else branch ONLY if it has content
    if (else_branch && Array.isArray(else_branch) && else_branch.length > 0) {
      result += `else:\n`;
      result += this.convertBranch(else_branch, context);
    }
    
    return result;
  }

  convertExpression(expr, context) {
    if (!expr) return '';
    
    const generators = context?.generators || {};
    const operatorsGenerator = generators.operators;
    
    if (operatorsGenerator && operatorsGenerator.canGenerate && 
        operatorsGenerator.canGenerate(expr)) {
      return operatorsGenerator.generate(expr, context);
    }
    
    // Fallback for simple expressions
    if (expr.type === 'binary_expression') {
      const left = this.convertExpression(expr.left, context);
      const right = this.convertExpression(expr.right, context);
      return `(${left} ${expr.operator} ${right})`;
    } else if (expr.type === 'identifier') {
      return expr.name || '""';
    } else if (expr.type === 'literal') {
      return expr.value || '""';
    } else if (expr.value) {
      return expr.value;
    }
    
    return JSON.stringify(expr);
  }

  convertBranch(branch, context) {
    if (!branch || !Array.isArray(branch) || branch.length === 0) {
      return '    pass\n';
    }
    
    let result = '';
    for (const statement of branch) {
      if (!statement) continue;
      
      const generators = context?.generators || {};
      let generated = '';
      
      // Try each generator
      for (const [name, generator] of Object.entries(generators)) {
        if (generator && generator.canGenerate && generator.canGenerate(statement)) {
          generated = generator.generate(statement, context);
          break;
        }
      }
      
      if (!generated) {
        // Handle break/continue statements specifically
        if (statement.type === 'break_statement') {
          generated = 'break';
        } else if (statement.type === 'continue_statement') {
          generated = 'continue';
        } else if (statement.type === 'expression_statement') {
          // Try to generate update expressions
          if (statement.expression && statement.expression.type === 'update_expression') {
            const varName = statement.expression.operand?.name || 'i';
            const op = statement.expression.operator;
            if (op === '++') {
              generated = `${varName} += 1`;
            } else if (op === '--') {
              generated = `${varName} -= 1`;
            }
          }
        }
      }
      
      if (generated) {
        result += `    ${generated}\n`;
      } else {
        result += '    pass\n';
      }
    }
    
    return result;
  }
}