import { CParserBase } from './parser-base.js';

export class ControlFlowParser extends CParserBase {
  canParse(node) {
    return node.type === 'if_statement' ||
           node.type === 'switch_statement' ||
           node.type === 'conditional_expression';
  }

  parse(node, context) {
    console.log(`DEBUG ControlFlowParser: Parsing ${node.type} with ${node.children?.length || 0} children`);
    
    if (node.type === 'if_statement') {
      return this.parseIfStatement(node, context);
    } else if (node.type === 'switch_statement') {
      return this.parseSwitchStatement(node, context);
    } else if (node.type === 'conditional_expression') {
      return this.parseTernaryExpression(node, context);
    }
    return null;
  }

  parseIfStatement(node, context) {
    const result = {
      type: 'conditional_statement',
      condition: null,
      then_branch: [],
      else_if_branches: [],
      else_branch: []
    };
    
    console.log(`DEBUG ControlFlowParser: Parsing if_statement`);
    
    // Parse condition
    for (let i = 0; i < (node.children?.length || 0); i++) {
      const child = node.children[i];
      
      if (child.type === 'parenthesized_expression' && child.children) {
        for (let j = 0; j < child.children.length; j++) {
          const innerChild = child.children[j];
          if (innerChild.type === 'binary_expression' || 
              innerChild.type === 'comparison_expression' ||
              innerChild.type === 'logical_expression') {
            result.condition = this.parseExpressionProperly(innerChild, context);
            console.log(`DEBUG ControlFlowParser: Found condition: ${JSON.stringify(result.condition)}`);
            break;
          }
        }
      } else if (child.type === 'binary_expression' || 
                 child.type === 'comparison_expression' ||
                 child.type === 'logical_expression') {
        result.condition = this.parseExpressionProperly(child, context);
        console.log(`DEBUG ControlFlowParser: Found condition directly: ${JSON.stringify(result.condition)}`);
      }
      
      if (result.condition) break;
    }
    
    // Find then branch
    let foundCondition = false;
    for (let i = 0; i < (node.children?.length || 0); i++) {
      const child = node.children[i];
      
      if (child.type === 'parenthesized_expression' || 
          child.type === 'binary_expression' ||
          child.type === 'comparison_expression') {
        foundCondition = true;
        continue;
      }
      
      if (foundCondition && (child.type === 'compound_statement' || 
                             child.type === 'expression_statement')) {
        result.then_branch = this.parseBlock(child, context);
        console.log(`DEBUG ControlFlowParser: Found then branch with ${result.then_branch.length} statements`);
        break;
      }
    }
    
    // Look for else or else if
    for (let i = 0; i < (node.children?.length || 0); i++) {
      const child = node.children[i];
      
      if (child.type === 'else') {
        if (i + 1 < node.children.length) {
          const nextChild = node.children[i + 1];
          
          if (nextChild.type === 'if_statement') {
            const elseIfResult = this.parseIfStatement(nextChild, context);
            result.else_if_branches.push({
              condition: elseIfResult.condition,
              then_branch: elseIfResult.then_branch
            });
            if (elseIfResult.else_if_branches.length > 0) {
              result.else_if_branches.push(...elseIfResult.else_if_branches);
            }
            if (elseIfResult.else_branch.length > 0) {
              result.else_branch = elseIfResult.else_branch;
            }
          } else {
            result.else_branch = this.parseBlock(nextChild, context);
          }
        }
        break;
      }
    }
    
    return result;
  }

  parseSwitchStatement(node, context) {
    const result = {
      type: 'switch_statement',
      condition: null,
      cases: []
    };
    
    console.log(`DEBUG ControlFlowParser: Parsing switch_statement`);
    
    // Find condition
    for (let i = 0; i < (node.children?.length || 0); i++) {
      const child = node.children[i];
      
      if (child.type === 'parenthesized_expression' && child.children) {
        for (let j = 0; j < child.children.length; j++) {
          const innerChild = child.children[j];
          if (innerChild.type === 'identifier' || innerChild.type === 'number_literal') {
            result.condition = this.parseExpressionProperly(innerChild, context);
            console.log(`DEBUG ControlFlowParser: Switch condition: ${JSON.stringify(result.condition)}`);
            break;
          }
        }
        break;
      }
    }
    
    // Find switch body
    for (let i = 0; i < (node.children?.length || 0); i++) {
      const child = node.children[i];
      
      if (child.type === 'compound_statement') {
        this.parseSwitchBody(child, result.cases, context);
        break;
      }
    }
    
    console.log(`DEBUG ControlFlowParser: Switch has ${result.cases.length} cases`);
    return result;
  }

  parseSwitchBody(compoundNode, casesArray, context) {
    if (!compoundNode || !compoundNode.children) return;
    
    let currentCase = null;
    
    for (let i = 0; i < compoundNode.children.length; i++) {
      const child = compoundNode.children[i];
      
      if (child.type === '{' || child.type === '}') continue;
      
      if (child.type === 'case_statement') {
        if (currentCase) {
          casesArray.push(currentCase);
        }
        
        currentCase = {
          type: 'case',
          value: null,
          body: []
        };
        
        if (child.children) {
          for (let j = 0; j < child.children.length; j++) {
            const caseChild = child.children[j];
            
            if (caseChild.type === 'case' && j + 1 < child.children.length) {
              const valueChild = child.children[j + 1];
              currentCase.value = this.parseExpressionProperly(valueChild, context);
              console.log(`DEBUG ControlFlowParser: Case value: ${JSON.stringify(currentCase.value)}`);
              j++; // Skip value child
            } else if (caseChild.type === ':' || caseChild.type === 'default') {
              continue;
            } else if (caseChild.type !== 'case') {
              const parsed = this.parseNodeDirectly(caseChild, context);
              if (parsed) {
                currentCase.body.push(parsed);
                console.log(`DEBUG ControlFlowParser: Added ${parsed.type} to case body`);
              }
            }
          }
        }
      } else if (child.type === 'default_statement') {
        if (currentCase) {
          casesArray.push(currentCase);
        }
        
        currentCase = {
          type: 'default',
          body: []
        };
        
        if (child.children) {
          for (let j = 0; j < child.children.length; j++) {
            const defaultChild = child.children[j];
            
            if (defaultChild.type !== 'default' && defaultChild.type !== ':') {
              const parsed = this.parseNodeDirectly(defaultChild, context);
              if (parsed) {
                currentCase.body.push(parsed);
                console.log(`DEBUG ControlFlowParser: Added ${parsed.type} to default body`);
              }
            }
          }
        }
      } else if (currentCase) {
        const parsed = this.parseNodeDirectly(child, context);
        if (parsed) {
          currentCase.body.push(parsed);
          console.log(`DEBUG ControlFlowParser: Added ${parsed.type} to existing case body`);
        }
      }
    }
    
    if (currentCase) {
      casesArray.push(currentCase);
    }
  }

  parseTernaryExpression(node, context) {
    console.log(`DEBUG ControlFlowParser: Parsing ternary_expression`);
    
    let condition = null;
    let thenValue = null;
    let elseValue = null;
    
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        
        if (child.type === 'parenthesized_expression' ||
            child.type === 'binary_expression' ||
            child.type === 'comparison_expression' ||
            child.type === 'logical_expression') {
          if (!condition) {
            condition = child;
            console.log(`DEBUG ControlFlowParser: Found ternary condition: ${child.type}`);
          }
        } else if (child.type === '?' && i + 1 < node.children.length) {
          thenValue = node.children[i + 1];
          console.log(`DEBUG ControlFlowParser: Found ternary then value: ${thenValue.type}`);
          i++;
        } else if (child.type === ':' && i + 1 < node.children.length) {
          elseValue = node.children[i + 1];
          console.log(`DEBUG ControlFlowParser: Found ternary else value: ${elseValue.type}`);
          i++;
        }
      }
    }
    
    const result = {
      type: 'ternary_expression',
      condition: this.parseExpressionProperly(condition, context),
      thenValue: this.parseExpressionProperly(thenValue, context),
      elseValue: this.parseExpressionProperly(elseValue, context)
    };
    
    console.log(`DEBUG ControlFlowParser: Ternary result:`, result);
    return result;
  }

  parseExpressionProperly(node, context) {
    if (!node) return null;
    
    console.log(`DEBUG ControlFlowParser: parseExpressionProperly for ${node.type} - "${node.text?.substring(0, 30)}..."`);
    
    if (node.type === 'identifier') {
      return {
        type: 'identifier',
        name: node.text
      };
    } else if (node.type === 'number_literal') {
      return {
        type: 'literal',
        value: node.text,
        data_type: 'int'
      };
    } else if (node.type === 'string_literal') {
      let value = node.text;
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      return {
        type: 'literal',
        value: value,
        data_type: 'String'
      };
    } else if (node.type === 'binary_expression' || 
               node.type === 'comparison_expression' ||
               node.type === 'logical_expression') {
      if (!node.children) return null;
      
      let left = null;
      let operator = null;
      let right = null;
      
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        
        if (child.type === 'identifier' || child.type === 'number_literal') {
          if (!left) {
            left = this.parseExpressionProperly(child, context);
          } else if (!right) {
            right = this.parseExpressionProperly(child, context);
          }
        } else if (child.type === 'binary_expression' || 
                   child.type === 'comparison_expression' ||
                   child.type === 'logical_expression') {
          if (!left) {
            left = this.parseExpressionProperly(child, context);
          } else if (!right) {
            right = this.parseExpressionProperly(child, context);
          }
        } else if (['+', '-', '*', '/', '%', 
                    '==', '!=', '<', '>', '<=', '>=', 
                    '&&', '||'].includes(child.text)) {
          operator = child.text;
        }
      }
      
      if (!left && node.children.length >= 1) {
        left = this.parseExpressionProperly(node.children[0], context);
      }
      
      if (!operator && node.children.length >= 2) {
        operator = node.children[1]?.text;
      }
      
      if (!right && node.children.length >= 3) {
        right = this.parseExpressionProperly(node.children[2], context);
      }
      
      return {
        type: node.type,
        left: left,
        operator: operator,
        right: right
      };
    }
    
    return {
      type: 'expression',
      value: node.text || '',
      data_type: 'unknown'
    };
  }

  parseBlock(node, context) {
    const statements = [];
    
    if (!node) return statements;
    
    console.log(`DEBUG ControlFlowParser: parseBlock for ${node.type} with ${node.children?.length || 0} children`);
    
    if (node.type === 'compound_statement') {
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                if (child.type === '}' || child.type === '{') continue;
                
                console.log(`DEBUG ControlFlowParser: Child ${i}: ${child.type} - "${child.text?.substring(0, 30)}..."`);
                
                // Try to parse the child
                const parsed = this.parseNodeDirectly(child, context);
                if (parsed) {
                    console.log(`DEBUG ControlFlowParser: Successfully parsed ${parsed.type}`);
                    statements.push(parsed);
                } else {
                    console.log(`DEBUG ControlFlowParser: Failed to parse ${child.type}`);
                }
            }
        }
    } else if (node.type === 'expression_statement') {
        console.log(`DEBUG ControlFlowParser: Parsing expression_statement directly`);
        const parsed = this.parseNodeDirectly(node, context);
        if (parsed) {
            statements.push(parsed);
        }
    }
    
    console.log(`DEBUG ControlFlowParser: parseBlock returning ${statements.length} statements`);
    return statements;
}

  parseNodeDirectly(node, context) {
    if (!node) return null;
    
    console.log(`DEBUG ControlFlowParser: parseNodeDirectly for ${node.type} - "${node.text?.substring(0, 30)}..."`);
    
    // FIX: Special handling for call_expression (printf)
    if (node.type === 'call_expression' && node.text && node.text.includes('printf')) {
        console.log(`DEBUG ControlFlowParser: Found printf call, trying print parser`);
        
        // Get print parser from context
        const parsers = context?.parsers || {};
        const printParser = parsers.print;
        
        if (printParser && printParser.canParse && printParser.canParse(node)) {
            try {
                const parsed = printParser.parse(node, context);
                if (parsed) {
                    console.log(`DEBUG ControlFlowParser: Successfully parsed printf as ${parsed.type}`);
                    // Copy position info
                    if (node._position) {
                        parsed._position = { ...node._position };
                    } else {
                        parsed._position = {
                            originalText: node.text
                        };
                    }
                    return parsed;
                }
            } catch (error) {
                console.warn(`ControlFlowParser: Failed to parse printf with print parser:`, error.message);
            }
        } else {
            console.log(`DEBUG ControlFlowParser: No print parser available for printf`);
        }
    }
    
    // FIX: Special handling for expression_statement nodes
    if (node.type === 'expression_statement' && node.children) {
        // Look for call_expression inside expression_statement
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (child.type === 'call_expression' && child.text && child.text.includes('printf')) {
                return this.parseNodeDirectly(child, context);
            }
        }
    }
    
    // FIX: Special handling for break_statement
    if (node.type === 'break_statement') {
        return {
            type: 'break_statement',
            _position: {
                originalText: node.text
            }
        };
    }
    
    const parsers = context?.parsers || {};
    
    for (const [parserName, parser] of Object.entries(parsers)) {
        console.log(`DEBUG ControlFlowParser: Trying parser "${parserName}" for ${node.type}`);
        if (parser && parser.canParse && parser.canParse(node)) {
            console.log(`DEBUG ControlFlowParser: Found parser "${parserName}" for ${node.type}`);
            try {
                const parsed = parser.parse(node, context);
                if (parsed) {
                    console.log(`DEBUG ControlFlowParser: Successfully parsed ${parsed.type}`);
                    if (node._position) {
                        parsed._position = { ...node._position };
                    } else {
                        parsed._position = {
                            originalText: node.text
                        };
                    }
                    return parsed;
                }
            } catch (error) {
                console.warn(`ControlFlowParser: Failed to parse ${node.type} with ${parserName}:`, error.message);
            }
            break;
        }
    }
    
    console.log(`DEBUG ControlFlowParser: No parser found for ${node.type}`);
    
    const expression = this.parseExpressionProperly(node, context);
    if (expression) {
        return expression;
    }
    
    return null;
}
}

export default ControlFlowParser;