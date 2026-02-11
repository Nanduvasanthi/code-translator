import { LoopStatement, BinaryExpression, VariableDeclaration } from '../../core/ast-nodes.js';

export class LoopsParser {
  canParse(node) {
    return node.type === 'for_statement' || 
           node.type === 'while_statement' ||
           node.type === 'do_statement' ||
           node.type === 'enhanced_for_statement';
  }

  parse(node, context) {
    switch (node.type) {
      case 'for_statement':
        return this.parseForLoop(node, context);
      case 'while_statement':
        return this.parseWhileLoop(node, context);
      case 'do_statement':
        return this.parseDoWhileLoop(node, context);
      case 'enhanced_for_statement':
        return this.parseEnhancedForLoop(node, context);
      default:
        return null;
    }
  }

  parseForLoop(node, context) {
    console.log('=== DEBUG parseForLoop ===');
    
    let initialization = null;
    let condition = null;
    let update = null;
    let body = null;
    
    // Extract for loop components manually
    const children = [];
    for (let i = 0; i < node.childCount; i++) {
      children.push(node.child(i));
    }
    
    console.log('For loop children:', children.map(c => `${c.type}: "${c.text.substring(0, 30)}"`));
    
    // Parse initialization (usually at index 2)
    if (children.length > 2 && children[2].type === 'local_variable_declaration') {
      const varParser = context.getParser('variables');
      if (varParser && varParser.canParse(children[2])) {
        initialization = varParser.parse(children[2], context);
        console.log('Initialization parsed:', initialization);
      }
    }
    
    // Parse condition (usually at index 3)
    if (children.length > 3 && children[3].type === 'binary_expression') {
      const operatorsParser = context.getParser('operators');
      if (operatorsParser && operatorsParser.canParse(children[3])) {
        condition = operatorsParser.parse(children[3], context);
        console.log('Condition parsed:', condition);
      }
    }
    
    // Parse update (usually at index 5)
    if (children.length > 5 && children[5].type === 'update_expression') {
      update = this.parseUpdateExpression(children[5], context);
      console.log('Update parsed:', update);
    }
    
    // Parse body (last block)
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'block') {
        body = this.parseBlock(child, context);
        break;
      }
    }
    
    // Create a LoopStatement AST node
    return new LoopStatement('for', null, null, body, {
      initialization: initialization,
      condition: condition,
      update: update
    });
  }

  parseUpdateExpression(node, context) {
    const text = node.text.trim();
    
    if (text.endsWith('++')) {
      const varName = text.substring(0, text.length - 2).trim();
      return {
        type: 'update_expression',
        variable: { type: 'identifier', name: varName },
        operator: '++',
        is_postfix: true
      };
    } else if (text.endsWith('--')) {
      const varName = text.substring(0, text.length - 2).trim();
      return {
        type: 'update_expression',
        variable: { type: 'identifier', name: varName },
        operator: '--',
        is_postfix: true
      };
    }
    
    return { 
      type: 'expression', 
      value: text 
    };
  }

  parseWhileLoop(node, context) {
    console.log('=== DEBUG parseWhileLoop ===');
    
    let condition = null;
    let body = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      console.log(`  Child [${i}]: ${child.type}: "${child.text.substring(0, 30)}"`);
      
      if (child.type === 'parenthesized_expression' || child.type === 'condition') {
        console.log('  Found condition node');
        
        // Look for binary expression inside
        for (let j = 0; j < child.childCount; j++) {
          const inner = child.child(j);
          
          if (inner.type === 'binary_expression') {
            const operatorsParser = context.getParser('operators');
            if (operatorsParser && operatorsParser.canParse(inner)) {
              condition = operatorsParser.parse(inner, context);
              console.log('  Parsed condition:', condition);
              break;
            }
          }
        }
      } else if (child.type === 'block') {
        console.log('  Found block, parsing body...');
        body = this.parseBlock(child, context);
      }
    }
    
    return new LoopStatement('while', null, null, body, condition);
  }

  parseDoWhileLoop(node, context) {
    let condition = null;
    let body = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'block') {
        body = this.parseBlock(child, context);
      } else if (child.type === 'while') {
        // Look for condition after 'while'
        for (let j = i + 1; j < node.childCount; j++) {
          const nextChild = node.child(j);
          if (nextChild.type === 'parenthesized_expression') {
            for (let k = 0; k < nextChild.childCount; k++) {
              const inner = nextChild.child(k);
              if (inner.type === 'binary_expression') {
                const operatorsParser = context.getParser('operators');
                if (operatorsParser && operatorsParser.canParse(inner)) {
                  condition = operatorsParser.parse(inner, context);
                  break;
                }
              }
            }
            break;
          }
        }
      }
    }
    
    return new LoopStatement('do_while', null, null, body, condition);
  }

  parseEnhancedForLoop(node, context) {
    console.log('=== DEBUG parseEnhancedForLoop ===');
    
    // Log all children for debugging
    console.log('Enhanced for loop children:');
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      console.log(`  [${i}] ${child.type}: "${child.text.substring(0, 30)}"`);
    }
    
    let variable = null;
    let iterable = null;
    let body = null;
    
    // Direct parsing of the structure:
    // for (String fruit : fruits) {
    //   children: for, (, type_identifier, identifier, :, identifier, ), block
    
    let varType = null;
    let varName = null;
    let iterableName = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'type_identifier') {
        varType = child.text;
      } else if (child.type === 'identifier') {
        // First identifier is the variable name (fruit)
        // Second identifier after colon is the iterable (fruits)
        if (!varName && varType) {
          varName = child.text;
        } else if (varName && !iterableName) {
          iterableName = child.text;
        }
      } else if (child.type === 'block') {
        body = this.parseBlock(child, context);
      }
    }
    
    // Create variable declaration
    if (varName && varType) {
      variable = {
        type: 'variable_declaration',
        name: varName,
        data_type: varType,
        value: null
      };
    }
    
    // Create iterable reference
    if (iterableName) {
      iterable = { type: 'identifier', name: iterableName };
    }
    
    console.log('Parsed enhanced for loop:', { 
      variable: variable ? variable.name : null, 
      iterable: iterable ? iterable.name : null 
    });
    
    return new LoopStatement('enhanced_for', variable, iterable, body);
  }

  parseBlock(blockNode, context) {
    const statements = [];
    
    for (let i = 0; i < blockNode.childCount; i++) {
      const child = blockNode.child(i);
      
      if (child.type === '{' || child.type === '}') continue;
      
      // Parse statements in the block
      if (child.type === 'expression_statement') {
        const expr = this.parseExpressionStatement(child, context);
        if (expr) {
          statements.push(expr);
        }
      } else if (child.type === 'local_variable_declaration') {
        const varParser = context.getParser('variables');
        if (varParser && varParser.canParse(child)) {
          statements.push(varParser.parse(child, context));
        }
      } else if (child.type === 'for_statement' || 
                 child.type === 'while_statement' ||
                 child.type === 'do_statement' ||
                 child.type === 'enhanced_for_statement') {
        const loopAst = this.parse(child, context);
        if (loopAst) {
          statements.push(loopAst);
        }
      } else if (child.type === 'if_statement') {
        const controlFlowParser = context.getParser('controlFlow');
        if (controlFlowParser && controlFlowParser.canParse(child)) {
          statements.push(controlFlowParser.parse(child, context));
        }
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
      } else if (child.type === 'update_expression') {
        return this.parseUpdateExpression(child, context);
      }
    }
    
    return null;
  }
}