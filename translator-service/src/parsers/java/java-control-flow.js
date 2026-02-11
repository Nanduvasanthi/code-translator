import { ConditionalStatement } from '../../core/ast-nodes.js';

export class ControlFlowParser {
  canParse(node) {
    return node.type === 'if_statement' || node.type === 'switch_expression';
  }

  parse(node, context) {
    if (node.type === 'if_statement') {
      return this.parseIfStatement(node, context);
    } else if (node.type === 'switch_expression') {
      return this.parseSwitchStatement(node, context);
    }
    return null;
  }

  parseIfStatement(node, context) {
    console.log('=== DEBUG parseIfStatement START ===');
    console.log('Parsing if_statement node');
    console.log('Node type:', node.type);
    
    let condition = null;
    let thenBranch = null;
    let elseBranch = null;
    let elifBranches = [];
    
    // Parse condition (it's inside a condition or parenthesized_expression node)
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'condition' || child.type === 'parenthesized_expression') {
        condition = this.parseCondition(child, context);
        break;
      }
    }
    
    // Find then block (first block after condition)
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'block') {
        thenBranch = this.parseBlock(child, context);
        break;
      }
    }
    
    // Look for else/else if
    let currentNode = node;
    
    while (true) {
      let foundElse = false;
      let elseContent = null;
      
      // Look for 'else' keyword
      for (let i = 0; i < currentNode.childCount; i++) {
        const child = currentNode.child(i);
        if (child.type === 'else') {
          foundElse = true;
          // Find content after else
          for (let j = i + 1; j < currentNode.childCount; j++) {
            const nextChild = currentNode.child(j);
            if (nextChild.type === 'if_statement' || nextChild.type === 'block') {
              elseContent = nextChild;
              break;
            }
          }
          break;
        }
      }
      
      if (!foundElse) break;
      
      if (elseContent && elseContent.type === 'if_statement') {
        // It's an else if
        let elifCondition = null;
        let elifThenBranch = null;
        
        // Parse condition of else if
        for (let i = 0; i < elseContent.childCount; i++) {
          const child = elseContent.child(i);
          if (child.type === 'condition' || child.type === 'parenthesized_expression') {
            elifCondition = this.parseCondition(child, context);
            break;
          }
        }
        
        // Parse then branch of else if
        for (let i = 0; i < elseContent.childCount; i++) {
          const child = elseContent.child(i);
          if (child.type === 'block') {
            elifThenBranch = this.parseBlock(child, context);
            break;
          }
        }
        
        if (elifCondition && elifThenBranch) {
          elifBranches.push({
            type: 'conditional_branch',
            condition: elifCondition,
            then_branch: elifThenBranch
          });
        }
        
        // Continue parsing this else if for more else/else if
        currentNode = elseContent;
        
      } else if (elseContent && elseContent.type === 'block') {
        // It's a final else block
        elseBranch = this.parseBlock(elseContent, context);
        break;
      } else {
        break;
      }
    }
    
    console.log('=== DEBUG parseIfStatement END ===');
    console.log('Condition:', condition ? 'Found' : 'Not found');
    console.log('Elif branches:', elifBranches.length);
    console.log('Else branch:', elseBranch ? 'Found' : 'Not found');
    
    return {
      type: 'conditional_statement',
      condition: condition,
      then_branch: thenBranch,
      else_branch: elseBranch,
      elif_branches: elifBranches
    };
  }

  parseSwitchStatement(node, context) {
    console.log('=== DEBUG parseSwitchStatement ===');
    console.log('Parsing switch_expression node');
    
    let discriminant = null;
    const cases = [];
    
    // Parse switch expression (what's inside switch(...))
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === '(') {
        // The expression is the next child
        if (i + 1 < node.childCount) {
          const exprNode = node.child(i + 1);
          if (exprNode.type !== ')') {
            discriminant = this.parseExpression(exprNode, context);
          }
        }
        break;
      }
    }
    
    // Parse switch block (contains cases)
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'switch_block') {
        this.parseSwitchCases(child, cases, context);
        break;
      }
    }
    
    console.log('Switch discriminant:', discriminant);
    console.log('Number of cases:', cases.length);
    
    return {
      type: 'switch_statement',
      discriminant: discriminant,
      cases: cases
    };
  }

  parseCondition(node, context) {
    console.log('=== DEBUG parseCondition ===');
    console.log('Parsing condition node:', node.type);
    
    // Look inside the condition/parentheses for the actual expression
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'binary_expression') {
        // Parse binary expression (score >= 90)
        return this.parseBinaryExpression(child, context);
      } else if (child.type === 'identifier') {
        // Single identifier condition
        return { type: 'identifier', name: child.text };
      }
    }
    
    // Try operators parser as fallback
    const operatorsParser = context.getParser('operators');
    if (operatorsParser && operatorsParser.canParse(node)) {
      return operatorsParser.parse(node, context);
    }
    
    return { type: 'expression', value: node.text };
  }

  parseBinaryExpression(node, context) {
    let left = null;
    let right = null;
    let operator = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'identifier') {
        left = { type: 'identifier', name: child.text };
      } else if (child.type === 'integer_literal') {
        const value = child.text;
        if (!left) {
          left = { type: 'literal', value: parseInt(value), data_type: 'int' };
        } else {
          right = { type: 'literal', value: parseInt(value), data_type: 'int' };
        }
      } else if (child.type === '>' || child.type === '<' || 
                 child.type === '>=' || child.type === '<=' || 
                 child.type === '==' || child.type === '!=') {
        operator = child.type;
      }
    }
    
    if (left && right && operator) {
      return {
        type: 'binary_expression',
        left: left,
        operator: operator,
        right: right
      };
    }
    
    return { type: 'expression', value: node.text };
  }

  parseExpression(node, context) {
    if (node.type === 'identifier') {
      return { type: 'identifier', name: node.text };
    } else if (node.type === 'integer_literal') {
      return { type: 'literal', value: parseInt(node.text), data_type: 'int' };
    } else if (node.type === 'string_literal') {
      const text = node.text;
      return { type: 'literal', value: text.substring(1, text.length - 1), data_type: 'string' };
    }
    return { type: 'expression', value: node.text };
  }

  parseBlock(blockNode, context) {
    console.log('=== DEBUG parseBlock ===');
    
    const statements = [];
    
    for (let i = 0; i < blockNode.childCount; i++) {
      const child = blockNode.child(i);
      
      if (child.type === '{' || child.type === '}') continue;
      
      if (child.type === 'local_variable_declaration') {
        const varParser = context.getParser('variables');
        if (varParser && varParser.canParse(child)) {
          statements.push(varParser.parse(child, context));
        }
      } else if (child.type === 'expression_statement') {
        const expr = this.parseExpressionStatement(child, context);
        if (expr) statements.push(expr);
      } else if (child.type === 'if_statement') {
        statements.push(this.parseIfStatement(child, context));
      } else if (child.type === 'switch_expression') {
        statements.push(this.parseSwitchStatement(child, context));
      }
    }
    
    return { type: 'block', statements: statements };
  }

  parseExpressionStatement(node, context) {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'method_invocation') {
        const printParser = context.getParser('print');
        if (printParser && printParser.canParse(child)) {
          return printParser.parse(child, context);
        }
      } else if (child.type === 'assignment_expression') {
        const operatorsParser = context.getParser('operators');
        if (operatorsParser && operatorsParser.canParse(child)) {
          return operatorsParser.parse(child, context);
        }
      }
    }
    return null;
  }

  parseSwitchCases(blockNode, cases, context) {
    for (let i = 0; i < blockNode.childCount; i++) {
      const child = blockNode.child(i);
      
      if (child.type === 'switch_block_statement_group') {
        const caseInfo = this.parseCaseGroup(child, context);
        if (caseInfo) cases.push(caseInfo);
      }
    }
  }

  parseCaseGroup(node, context) {
    let test = null;
    const consequent = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'switch_label') {
        // Parse case or default
        for (let j = 0; j < child.childCount; j++) {
          const labelChild = child.child(j);
          if (labelChild.type === 'case') {
            if (j + 1 < child.childCount) {
              test = this.parseExpression(child.child(j + 1), context);
            }
            break;
          } else if (labelChild.type === 'default') {
            test = { type: 'default' };
            break;
          }
        }
      } else if (child.type === 'expression_statement') {
        const stmt = this.parseExpressionStatement(child, context);
        if (stmt) consequent.push(stmt);
      } else if (child.type === 'local_variable_declaration') {
        const varParser = context.getParser('variables');
        if (varParser && varParser.canParse(child)) {
          consequent.push(varParser.parse(child, context));
        }
      }
    }
    
    if (test) {
      return {
        type: test.type === 'default' ? 'default' : 'case',
        test: test.type === 'default' ? null : test,
        consequent: { type: 'block', statements: consequent }
      };
    }
    
    return null;
  }
}