export class ConditionalsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'conditional_statement' || 
           astNode.type === 'switch_statement' ||
           (astNode.constructor && astNode.constructor.name === 'ConditionalStatement');
  }

  generate(astNode, context) {
    if (astNode.type === 'conditional_statement' || 
        (astNode.constructor && astNode.constructor.name === 'ConditionalStatement')) {
      return this.generateIfStatement(astNode, context);
    } else if (astNode.type === 'switch_statement') {
      return this.generateSwitchStatement(astNode, context);
    }
    return '';
  }

  generateIfStatement(astNode, context) {
    const indent = context.getIndent();
    
    console.log('=== DEBUG generateIfStatement START ===');
    console.log('AST Node type:', astNode.type);
    console.log('AST Node properties:', Object.keys(astNode));
    
    const condition = astNode.condition;
    const thenBranch = astNode.then_branch;
    const elseBranch = astNode.else_branch;
    const elifBranches = astNode.elif_branches || [];
    
    console.log('Condition:', condition);
    console.log('then_branch:', thenBranch);
    console.log('else_branch:', elseBranch);
    console.log('elif_branches:', elifBranches.length);
    
    // Generate condition without extra parentheses
    const generatedCondition = this.generateExpression(condition, context, true);
    
    context.increaseIndent();
    const consequent = this.generateBlock(thenBranch, context);
    context.decreaseIndent();
    
    let result = `${indent}if ${generatedCondition}:\n${consequent}`;
    
    // Generate elif branches
    for (let i = 0; i < elifBranches.length; i++) {
      const elifBranch = elifBranches[i];
      if (elifBranch) {
        console.log(`Processing elif branch ${i}:`, elifBranch);
        const elifCondition = this.generateExpression(elifBranch.condition, context, true);
        
        context.increaseIndent();
        const elifConsequent = this.generateBlock(elifBranch.then_branch, context);
        context.decreaseIndent();
        
        result += `\n${indent}elif ${elifCondition}:\n${elifConsequent}`;
      }
    }
    
    // Generate else branch
    if (elseBranch) {
      context.increaseIndent();
      const elseConsequent = this.generateBlock(elseBranch, context);
      context.decreaseIndent();
      
      result += `\n${indent}else:\n${elseConsequent}`;
    }
    
    console.log('=== DEBUG generateIfStatement END ===');
    
    return result;
  }

  generateSwitchStatement(astNode, context) {
    console.log('=== DEBUG generateSwitchStatement ===');
    console.log('Switch discriminant:', astNode.discriminant);
    console.log('Number of cases:', astNode.cases?.length || 0);
    
    const indent = context.getIndent();
    
    if (!astNode.discriminant) {
      // If discriminant is null/undefined, use a placeholder
      console.log('WARNING: Switch discriminant is null');
      return `${indent}# Switch statement (could not parse expression)`;
    }
    
    const discriminant = this.generateExpression(astNode.discriminant, context);
    const cases = astNode.cases || [];
    
    if (cases.length === 0) {
      return `${indent}# Empty switch statement`;
    }
    
    let result = `${indent}# Switch statement converted to if-elif-else\n`;
    
    let hasDefault = false;
    let caseIndex = 0;
    
    for (let i = 0; i < cases.length; i++) {
      const caseNode = cases[i];
      
      if (!caseNode) continue;
      
      console.log(`Processing case ${i}:`, caseNode);
      
      if (caseNode.type === 'case' && caseNode.test) {
        const testValue = this.generateExpression(caseNode.test, context);
        const condition = `${discriminant} == ${testValue}`;
        const keyword = caseIndex === 0 ? 'if' : 'elif';
        
        context.increaseIndent();
        const caseCode = this.generateBlock(caseNode.consequent, context);
        context.decreaseIndent();
        
        // Add newline between cases
        if (caseIndex > 0) {
          result += '\n';
        }
        result += `${indent}${keyword} ${condition}:\n${caseCode}`;
        caseIndex++;
        
      } else if (caseNode.type === 'default') {
        hasDefault = true;
        
        context.increaseIndent();
        const defaultCode = this.generateBlock(caseNode.consequent, context);
        context.decreaseIndent();
        
        // Add newline before else
        result += `\n${indent}else:\n${defaultCode}`;
        break; // Default should be last
      }
    }
    
    if (!hasDefault && cases.length > 0) {
      result += `\n${indent}else:\n${indent}    pass  # No default case in switch`;
    }
    
    return result;
  }

  generateBlock(block, context) {
    console.log('=== DEBUG generateBlock START ===');
    console.log('Block:', block);
    console.log('Block type:', block?.type);
    console.log('Block statements:', block?.statements?.length || 0);
    
    if (!block) {
      console.log('No block, returning pass');
      return context.getIndent() + '    pass';
    }
    
    const statements = block.statements || [];
    
    if (statements.length === 0) {
      console.log('Empty block, returning pass');
      return context.getIndent() + '    pass';
    }
    
    console.log('Processing', statements.length, 'statements');
    
    const originalIndent = context.getIndent();
    
    context.increaseIndent();
    const blockIndent = context.getIndent();
    
    const generatedStatements = [];
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Statement ${i}:`, stmt?.type, stmt);
      
      let generated = null;
      
      // Try to find appropriate generator
      if (context.generators) {
        for (const [name, generator] of Object.entries(context.generators)) {
          if (generator.canGenerate && generator.canGenerate(stmt)) {
            generated = generator.generate(stmt, context);
            break;
          }
        }
      }
      
      if (!generated) {
        console.log('No generator found, trying fallback...');
        
        // Fallback for common statement types
        if (stmt.type === 'variable_declaration') {
          const value = stmt.value ? this.generateExpression(stmt.value, context) : 'None';
          generated = `${blockIndent}${stmt.name} = ${value}`;
        } else if (stmt.type === 'assignment_expression') {
          const left = this.generateExpression(stmt.left, context);
          const right = this.generateExpression(stmt.right, context);
          generated = `${blockIndent}${left} = ${right}`;
        } else if (stmt.type === 'print_statement') {
          // FIX: Ensure string literals have quotes in print statements
          const args = stmt.arguments?.map(arg => {
            const genArg = this.generateExpression(arg, context);
            // Check if it's a string literal that needs quotes
            if (arg.type === 'string_literal' || (arg.type === 'literal' && typeof arg.value === 'string')) {
              if (!genArg.startsWith('"') && !genArg.startsWith("'")) {
                return `"${genArg}"`;
              }
            }
            return genArg;
          }).join(', ') || '';
          generated = `${blockIndent}print(${args})`;
        } else if (stmt.type === 'binary_expression') {
          const left = this.generateExpression(stmt.left, context);
          const right = this.generateExpression(stmt.right, context);
          const operator = this.mapOperator(stmt.operator);
          generated = `${blockIndent}(${left} ${operator} ${right})`;
        }
      }
      
      if (generated) {
        generatedStatements.push(generated);
      } else {
        generatedStatements.push(`${blockIndent}# Unknown statement type: ${stmt?.type}`);
      }
    }
    
    context.decreaseIndent();
    
    const result = generatedStatements.join('\n');
    console.log('Generated block result:', result);
    console.log('=== DEBUG generateBlock END ===');
    return result;
  }

  generateExpression(expr, context, isCondition = false) {
    console.log('=== DEBUG generateExpression ===');
    console.log('Expression:', expr);
    
    if (!expr) return 'True';
    
    if (expr.type === 'binary_expression') {
      const left = this.generateExpression(expr.left, context);
      const right = this.generateExpression(expr.right, context);
      const operator = this.mapOperator(expr.operator);
      
      // For conditions, don't add extra parentheses
      if (isCondition) {
        return `${left} ${operator} ${right}`;
      }
      return `(${left} ${operator} ${right})`;
      
    } else if (expr.type === 'literal') {
      if (typeof expr.value === 'string') {
        return `"${expr.value}"`;
      } else if (expr.data_type === 'boolean') {
        return expr.value ? 'True' : 'False';
      }
      return String(expr.value);
      
    } else if (expr.type === 'identifier') {
      return expr.name;
      
    } else if (expr.type === 'string_literal') {
      return `"${expr.value}"`;
      
    } else if (expr.value !== undefined) {
      // Handle expression values - clean up parentheses for conditions
      let strValue = String(expr.value);
      
      if (isCondition && strValue.startsWith('(') && strValue.endsWith(')')) {
        strValue = strValue.substring(1, strValue.length - 1);
      }
      
      return strValue;
    }
    
    return 'True';
  }

  mapOperator(javaOperator) {
    const operatorMap = {
      '&&': 'and',
      '||': 'or',
      '==': '==',
      '!=': '!=',
      '>': '>',
      '<': '<',
      '>=': '>=',
      '<=': '<=',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%'
    };
    
    return operatorMap[javaOperator] || javaOperator;
  }
}