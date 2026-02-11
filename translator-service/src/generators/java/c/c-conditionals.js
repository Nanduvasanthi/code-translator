// generators/java/c-conditionals.js - FIXED WITH PROPER INDENTATION
export class CConditionalsGenerator {
  generate(astNode, context = {}, visitor) {
    if (!astNode) return '';
    
    // ⭐⭐ CRITICAL FIX: Get indentLevel from context, default to 2 for statements inside main method
    const indentLevel = context.indentLevel !== undefined ? context.indentLevel : 2;
    const indent = '    '.repeat(indentLevel);
    
    if (astNode.type === 'conditional_statement') {
      return this.generateIfStatement(astNode, indent, visitor, indentLevel);
    } else if (astNode.type === 'switch_statement') {
      return this.generateSwitchStatement(astNode, indent, visitor, indentLevel);
    } else if (astNode.type === 'ternary_expression') {
      return this.generateTernaryExpression(astNode, indent, visitor);
    }
    
    return '';
  }

  generateIfStatement(node, indent, visitor, baseIndentLevel) {
    console.log(`DEBUG CConditionalsGenerator: Generating if statement with baseIndentLevel=${baseIndentLevel}`);
    
    let output = '';
    
    // Generate if condition
    const condition = this.generateCondition(node.condition, visitor);
    output += `${indent}if (${condition}) {\n`;
    
    // Generate then branch - INCREASE indent level for body
    const thenIndent = '    '.repeat(baseIndentLevel + 1);
    if (node.then_branch && Array.isArray(node.then_branch)) {
      for (const stmt of node.then_branch) {
        // Pass increased indent level in context
        const stmtContext = { indentLevel: baseIndentLevel + 1 };
        const generated = visitor.visitNode(stmt, stmtContext);
        if (generated) {
          output += thenIndent + generated.trim() + '\n';
        }
      }
    }
    
    // Generate else if branches
    if (node.else_if_branches && node.else_if_branches.length > 0) {
      for (const elseIf of node.else_if_branches) {
        const elseIfCondition = this.generateCondition(elseIf.condition, visitor);
        output += `${indent}} else if (${elseIfCondition}) {\n`;
        
        if (elseIf.then_branch && Array.isArray(elseIf.then_branch)) {
          for (const stmt of elseIf.then_branch) {
            const stmtContext = { indentLevel: baseIndentLevel + 1 };
            const generated = visitor.visitNode(stmt, stmtContext);
            if (generated) {
              output += thenIndent + generated.trim() + '\n';
            }
          }
        }
      }
    }
    
    // Generate else branch
    if (node.else_branch && Array.isArray(node.else_branch) && node.else_branch.length > 0) {
      output += `${indent}} else {\n`;
      
      for (const stmt of node.else_branch) {
        const stmtContext = { indentLevel: baseIndentLevel + 1 };
        const generated = visitor.visitNode(stmt, stmtContext);
        if (generated) {
          output += thenIndent + generated.trim() + '\n';
        }
      }
      output += `${indent}}`;
    } else {
      // Close the if/else if chain
      output += `${indent}}`;
    }
    
    return output + '\n';
  }

  generateSwitchStatement(node, indent, visitor, baseIndentLevel) {
    console.log(`DEBUG CConditionalsGenerator: Generating switch statement with baseIndentLevel=${baseIndentLevel}`);
    
    let output = '';
    
    // Generate switch condition
    const condition = this.generateExpression(node.condition, visitor);
    output += `${indent}switch (${condition}) {\n`;
    
    const caseIndent = '    '.repeat(baseIndentLevel + 1);
    
    // Generate cases
    if (node.cases && Array.isArray(node.cases)) {
      for (const caseNode of node.cases) {
        // Check if this is a default case (empty value or type is 'default')
        const isDefault = caseNode.type === 'default' || 
                         !caseNode.value || 
                         caseNode.value.value === '' || 
                         caseNode.value.value === null ||
                         caseNode.value.value === undefined;
        
        if (isDefault) {
          output += `${caseIndent}default:\n`;
        } else {
          const caseValue = this.generateExpression(caseNode.value, visitor);
          output += `${caseIndent}case ${caseValue}:\n`;
        }
        
        // Generate case body - INCREASE indent level again for case body
        const bodyIndent = '    '.repeat(baseIndentLevel + 2);
        if (caseNode.body && Array.isArray(caseNode.body)) {
          let hasBreakStatement = false;
          
          // First, check if there's already a break statement in the body
          for (const stmt of caseNode.body) {
            if (stmt.type === 'break_statement') {
              hasBreakStatement = true;
              break;
            }
          }
          
          // Generate all statements
          for (const stmt of caseNode.body) {
            const stmtContext = { indentLevel: baseIndentLevel + 2 };
            const generated = visitor.visitNode(stmt, stmtContext);
            if (generated) {
              output += bodyIndent + generated.trim() + '\n';
            }
          }
          
          // Only add break if there isn't already one
          if (!hasBreakStatement) {
            output += bodyIndent + 'break;\n';
          }
        }
      }
    }
    
    output += `${indent}}\n`;
    return output;
  }

  generateTernaryExpression(node, indent, visitor) {
    const condition = this.generateCondition(node.condition, visitor);
    const thenValue = this.generateExpression(node.thenValue, visitor);
    const elseValue = this.generateExpression(node.elseValue, visitor);
    
    return `${indent}(${condition}) ? ${thenValue} : ${elseValue}`;
  }

  generateCondition(condition, visitor) {
    if (!condition) return 'true';
    
    // Use the operators generator for complex conditions
    if (visitor.generators?.operators) {
      const gen = visitor.generators.operators;
      let generated = '';
      
      if (typeof gen === 'function') {
        generated = gen(condition, {}, visitor);
      } else if (gen.generate && typeof gen.generate === 'function') {
        generated = gen.generate(condition, {}, visitor);
      } else if (gen.default && gen.default.generate && typeof gen.default.generate === 'function') {
        generated = gen.default.generate(condition, {}, visitor);
      }
      
      if (generated) {
        return generated;
      }
    }
    
    // Try to extract value from condition object
    if (condition.type === 'comparison_expression' || 
        condition.type === 'binary_expression' ||
        condition.type === 'logical_expression') {
      // Reconstruct the expression
      const left = condition.left ? (condition.left.name || condition.left.value || '') : '';
      const right = condition.right ? (condition.right.name || condition.right.value || '') : '';
      const operator = condition.operator || '';
      
      // Remove extra parentheses if already present
      let leftStr = left.toString();
      let rightStr = right.toString();
      
      if (leftStr.startsWith('(') && leftStr.endsWith(')')) {
        leftStr = leftStr.substring(1, leftStr.length - 1);
      }
      if (rightStr.startsWith('(') && rightStr.endsWith(')')) {
        rightStr = rightStr.substring(1, rightStr.length - 1);
      }
      
      return `(${leftStr} ${operator} ${rightStr})`;
    }
    
    // Handle simple values
    if (condition.value !== undefined) {
      return condition.value.toString();
    }
    
    if (condition.name) {
      return condition.name;
    }
    
    return 'true';
  }

  generateExpression(expr, visitor) {
    if (!expr) return '';
    
    // Use the operators generator
    if (visitor.generators?.operators) {
      const gen = visitor.generators.operators;
      let generated = '';
      
      if (typeof gen === 'function') {
        generated = gen(expr, {}, visitor);
      } else if (gen.generate && typeof gen.generate === 'function') {
        generated = gen.generate(expr, {}, visitor);
      } else if (gen.default && gen.default.generate && typeof gen.default.generate === 'function') {
        generated = gen.default.generate(expr, {}, visitor);
      }
      
      if (generated) {
        return generated;
      }
    }
    
    // Handle literals
    if (expr.type === 'literal') {
      if (expr.data_type === 'String') {
        return `"${expr.value}"`;
      }
      return expr.value.toString();
    }
    
    // Handle identifiers
    if (expr.type === 'identifier') {
      return expr.name || '';
    }
    
    // Handle raw expressions
    if (expr.value !== undefined) {
      return expr.value.toString();
    }
    
    if (expr.name) {
      return expr.name;
    }
    
    return '';
  }
}

export default {
  generate: function(node, context, visitor) {
    const generator = new CConditionalsGenerator();
    return generator.generate(node, context, visitor);
  }
};