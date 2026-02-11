import { ConditionalStatement } from '../../core/ast-nodes.js';

export class ConditionalsParser {
  canParse(node) {
    return node.type === 'if_statement';
  }

  parse(node, context, allClauses = null) {
    console.log('=== ConditionalsParser parsing ===');
    console.log('Node type:', node.type);
    
    if (!allClauses) {
      allClauses = this.collectClauses(node);
    }
    
    console.log(`Found ${allClauses.length} clauses:`, allClauses.map(c => c.type));
    
    // Extract if clause
    const ifClause = allClauses.find(c => c.type === 'if');
    if (!ifClause) return null;
    
    const condition = this.extractCondition(ifClause.node);
    const thenBranch = this.extractBlock(ifClause.node, context);
    
    console.log('If condition:', JSON.stringify(condition));
    console.log('Then branch statements:', thenBranch.length);
    
    // Extract elif clauses
    const elifBranches = [];
    const elifClauses = allClauses.filter(c => c.type === 'elif');
    console.log(`Processing ${elifClauses.length} elif clauses`);
    
    for (const elif of elifClauses) {
      const elifCondition = this.extractCondition(elif.node);
      const elifThenBranch = this.extractBlock(elif.node, context);
      elifBranches.push({ condition: elifCondition, thenBranch: elifThenBranch });
      console.log(`Elif condition: ${JSON.stringify(elifCondition)}`);
      console.log(`Elif branch statements: ${elifThenBranch.length}`);
    }
    
    // Extract else clause
    let elseBranch = null;
    const elseClause = allClauses.find(c => c.type === 'else');
    if (elseClause) {
      elseBranch = this.extractBlock(elseClause.node, context);
      console.log('Else branch statements:', elseBranch.length);
    }
    
    const astNode = new ConditionalStatement(condition, thenBranch, elseBranch, elifBranches);
    
    return astNode;
  }

  collectClauses(node) {
    const clauses = [{ type: 'if', node }];
    
    // Check if elif/else are direct children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'elif_clause') {
        clauses.push({ type: 'elif', node: child });
      } else if (child.type === 'else_clause') {
        clauses.push({ type: 'else', node: child });
      }
    }
    
    return clauses;
  }

  extractCondition(node) {
    console.log('=== Extracting condition from:', node.type);
    console.log('Node text:', node.text.substring(0, 100));
    
    // Find the comparison_expression
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'comparison_expression') {
        console.log('Found comparison_expression:', child.text);
        
        // Extract left, operator, and right
        let left = '';
        let operator = '';
        let right = '';
        
        for (let j = 0; j < child.childCount; j++) {
          const grandChild = child.child(j);
          
          if (grandChild.type === 'identifier') {
            left = grandChild.text;
          } else if (grandChild.type === 'comparison_operator') {
            operator = grandChild.text;
          } else if (grandChild.type === 'integer') {
            right = grandChild.text;
          }
        }
        
        if (left && operator && right) {
          const expression = `${left} ${operator} ${right}`;
          console.log('Built expression:', expression);
          return { 
            type: 'comparison', 
            left: left,
            operator: operator,
            right: right,
            expression: expression 
          };
        }
      }
    }
    
    // Fallback: extract from text
    const text = node.text;
    let conditionMatch = null;
    
    if (node.type === 'if_statement') {
      conditionMatch = text.match(/if\s+(.+?):/);
    } else if (node.type === 'elif_clause') {
      conditionMatch = text.match(/elif\s+(.+?):/);
    }
    
    if (conditionMatch) {
      const expr = conditionMatch[1].trim();
      console.log('Extracted from text:', expr);
      return { type: 'raw', value: expr };
    }
    
    console.log('No condition found, using default');
    return { type: 'raw', value: 'true' };
  }

  extractBlock(node, context) {
    const statements = [];
    
    // Find block node
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'block') {
        console.log('Found block for', node.type);
        // Extract statements from block
        this.extractStatementsFromBlock(child, statements, context);
        break;
      }
    }
    
    return statements;
  }

  extractStatementsFromBlock(blockNode, statements, context) {
    for (let i = 0; i < blockNode.childCount; i++) {
      const child = blockNode.child(i);
      
      if (child.type === 'expression_statement') {
        // Get the actual expression
        for (let j = 0; j < child.childCount; j++) {
          const expr = child.child(j);
          if (expr.type === 'assignment' || expr.type === 'call') {
            statements.push({
              type: 'raw',
              code: expr.text
            });
            break;
          }
        }
      } else if (child.type === 'assignment') {
        statements.push({
          type: 'raw',
          code: child.text
        });
      }
    }
  }
}