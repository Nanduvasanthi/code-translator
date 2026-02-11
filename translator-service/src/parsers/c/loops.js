// parsers/c/loops.js - COMPLETELY FIXED VERSION WITH BINARY EXPRESSION PARSING
export class LoopsParser {
  canParse(node) {
    return node.type === 'for_statement' || 
           node.type === 'while_statement' ||
           node.type === 'do_statement' ||
           node.type === 'break_statement' ||
           node.type === 'continue_statement';
  }

  parse(node, context) {
    console.log(`DEBUG LoopsParser: Parsing ${node.type}: "${node.text.substring(0, 50)}..."`);
    
    if (node.type === 'for_statement') {
      return this.parseForLoop(node, context);
    } else if (node.type === 'while_statement') {
      return this.parseWhileLoop(node, context);
    } else if (node.type === 'do_statement') {
      return this.parseDoWhileLoop(node, context);
    } else if (node.type === 'break_statement') {
      return {
        type: 'break_statement',
        _originalType: 'break_statement'
      };
    } else if (node.type === 'continue_statement') {
      return {
        type: 'continue_statement',
        _originalType: 'continue_statement'
      };
    }
    
    return null;
  }

  parseForLoop(node, context) {
    try {
      console.log(`DEBUG LoopsParser: Parsing for loop structure`);
      
      let initializer = null;
      let condition = null;
      let update = null;
      let body = [];
      
      // ⭐⭐ CRITICAL FIX: Use text-based parsing for reliability
      const text = node.text || '';
      console.log(`DEBUG LoopsParser: Full for loop text: "${text}"`);
      
      // Extract parts using regex
      const forMatch = text.match(/for\s*\(\s*(.*?)\s*;\s*(.*?)\s*;\s*(.*?)\s*\)\s*\{/);
      
      if (forMatch) {
        const initText = forMatch[1].trim();
        const condText = forMatch[2].trim();
        const updateText = forMatch[3].trim();
        
        console.log(`DEBUG LoopsParser: Extracted - init: "${initText}", cond: "${condText}", update: "${updateText}"`);
        
        // Parse initializer
        if (initText && initText !== ';') {
          initializer = this.parseForInitializer(initText, context);
        }
        
        // Parse condition - CRITICAL FIX HERE
        if (condText && condText !== ';') {
          console.log(`DEBUG LoopsParser: Parsing condition: "${condText}"`);
          condition = this.parseForCondition(condText, context);
        }
        
        // Parse update
        if (updateText && updateText !== '') {
          update = this.parseForUpdate(updateText, context);
        }
      }
      
      // Fallback to tree-sitter parsing if regex failed
      if (!initializer && !condition && !update) {
        console.log(`DEBUG LoopsParser: Falling back to tree-sitter parsing`);
        // ... (keep your existing tree-sitter parsing code)
      }
      
      // Find the body
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type === 'compound_statement') {
          body = this.parseBlock(child, context);
          break;
        }
      }
      
      // Ensure condition exists
      if (!condition) {
        condition = { type: 'literal', value: 'true', data_type: 'boolean' };
      }
      
      console.log(`DEBUG LoopsParser: For loop parsed - init: ${JSON.stringify(initializer)}, cond: ${JSON.stringify(condition)}, update: ${JSON.stringify(update)}, body: ${body.length} statements`);
      
      return {
        type: 'loop_statement',
        loop_type: 'for',
        initializer: initializer || { type: 'expression', value: '', data_type: 'unknown' },
        condition: condition,
        update: update || { type: 'expression', value: '', data_type: 'unknown' },
        body: body,
        _originalType: 'for_statement'
      };
    } catch (error) {
      console.error('Error parsing for loop:', error);
      return null;
    }
  }

  // ⭐⭐ NEW METHOD: Parse for loop initializer
  parseForInitializer(text, context) {
    console.log(`DEBUG LoopsParser: Parsing for initializer: "${text}"`);
    
    // Check if it's a variable declaration (int i = 0)
    if (text.match(/^(int|char|float|double|short|long|bool)\s+\w+/)) {
      // Create mock node for variable parser
      const mockNode = {
        type: 'declaration',
        text: text + ';',
        childCount: 0,
        child: () => null
      };
      
      if (context.parsers?.variables) {
        try {
          const result = context.parsers.variables.parse(mockNode, context);
          return Array.isArray(result) ? result[0] : result;
        } catch (e) {
          console.warn(`Failed to parse variable in for initializer:`, e.message);
        }
      }
      
      // Fallback: parse manually
      const parts = text.split(/\s+/);
      if (parts.length >= 2) {
        const dataType = parts[0];
        let name = parts[1];
        let value = null;
        
        // Check for assignment
        if (text.includes('=')) {
          const equalsIndex = text.indexOf('=');
          name = text.substring(text.indexOf(parts[1]), equalsIndex).trim();
          const valueText = text.substring(equalsIndex + 1).trim();
          value = { type: 'literal', value: valueText, data_type: dataType };
        }
        
        return {
          type: 'variable_declaration',
          name: name,
          data_type: dataType,
          value: value
        };
      }
    }
    
    // Check for assignment expression (i = 0)
    if (text.includes('=')) {
      const parts = text.split('=').map(p => p.trim());
      if (parts.length === 2) {
        return {
          type: 'assignment_expression',
          left: { type: 'identifier', name: parts[0] },
          operator: '=',
          right: this.parseValue(parts[1])
        };
      }
    }
    
    return { type: 'expression', value: text, data_type: 'unknown' };
  }

  // ⭐⭐ NEW METHOD: Parse for loop condition (FIXED!)
  parseForCondition(text, context) {
    console.log(`DEBUG LoopsParser: Parsing for condition: "${text}"`);
    
    // Check for comparison operators
    const comparisonPatterns = [
      /^(\w+)\s*([<>]=?|==|!=)\s*(\d+)$/,  // i < 5, i <= 5, i == 5, etc.
      /^(\w+)\s*([<>]=?|==|!=)\s*(\w+)$/,  // i < n, i <= length, etc.
      /^(\w+)\s*(&&|\|\|)\s*(\w+)$/        // i && j
    ];
    
    for (const pattern of comparisonPatterns) {
      const match = text.match(pattern);
      if (match) {
        const left = match[1];
        const operator = match[2];
        const right = match[3];
        
        console.log(`DEBUG LoopsParser: Matched comparison: ${left} ${operator} ${right}`);
        
        return {
          type: 'binary_expression',
          left: { type: 'identifier', name: left },
          operator: operator,
          right: this.parseValue(right)
        };
      }
    }
    
    // Check for boolean literals
    if (text === 'true' || text === 'false') {
      return { type: 'literal', value: text, data_type: 'boolean' };
    }
    
    // Check for identifier
    if (/^[a-zA-Z_]\w*$/.test(text)) {
      return { type: 'identifier', name: text };
    }
    
    // Check for numeric literal
    if (/^\d+$/.test(text)) {
      return { type: 'literal', value: text, data_type: 'int' };
    }
    
    // Default: treat as expression
    return { type: 'expression', value: text, data_type: 'unknown' };
  }

  // ⭐⭐ NEW METHOD: Parse for loop update
  parseForUpdate(text, context) {
    console.log(`DEBUG LoopsParser: Parsing for update: "${text}"`);
    
    // Check for increment/decrement
    if (text.match(/\w+\+\+$/) || text.match(/\w+--$/)) {
      // Postfix: i++, i--
      const variable = text.substring(0, text.length - 2);
      const operator = text.substring(text.length - 2);
      
      return {
        type: 'update_expression',
        operator: operator,
        operand: { type: 'identifier', name: variable }
      };
    } else if (text.match(/^\+\+\w+$/) || text.match(/^--\w+$/)) {
      // Prefix: ++i, --i
      const operator = text.substring(0, 2);
      const variable = text.substring(2);
      
      return {
        type: 'update_expression',
        operator: operator,
        operand: { type: 'identifier', name: variable }
      };
    }
    
    // Check for assignment (i = i + 1)
    if (text.includes('=')) {
      const parts = text.split('=').map(p => p.trim());
      if (parts.length === 2) {
        return {
          type: 'assignment_expression',
          left: { type: 'identifier', name: parts[0] },
          operator: '=',
          right: { type: 'expression', value: parts[1], data_type: 'unknown' }
        };
      }
    }
    
    return { type: 'expression', value: text, data_type: 'unknown' };
  }

  parseValue(text) {
    if (/^\d+$/.test(text)) {
      return { type: 'literal', value: text, data_type: 'int' };
    } else if (/^\d+\.\d+$/.test(text)) {
      return { type: 'literal', value: text, data_type: 'float' };
    } else if (text === 'true' || text === 'false') {
      return { type: 'literal', value: text, data_type: 'boolean' };
    } else if (/^[a-zA-Z_]\w*$/.test(text)) {
      return { type: 'identifier', name: text };
    } else {
      return { type: 'expression', value: text, data_type: 'unknown' };
    }
  }

  parseWhileLoop(node, context) {
    try {
      console.log(`DEBUG LoopsParser: Parsing while loop structure`);
      
      let condition = null;
      let body = [];
      
      // Extract condition using text parsing (more reliable)
      const text = node.text || '';
      const whileMatch = text.match(/while\s*\(\s*([^)]+)\s*\)\s*\{/);
      
      if (whileMatch) {
        const condText = whileMatch[1].trim();
        console.log(`DEBUG LoopsParser: Extracted while condition: "${condText}"`);
        condition = this.parseForCondition(condText, context);
      }
      
      // Find the body
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type === 'compound_statement') {
          body = this.parseBlock(child, context);
          break;
        }
      }
      
      if (!condition) {
        condition = { type: 'literal', value: 'true', data_type: 'boolean' };
      }
      
      console.log(`DEBUG LoopsParser: While loop parsed - cond: ${JSON.stringify(condition)}, body: ${body.length} statements`);
      
      return {
        type: 'loop_statement',
        loop_type: 'while',
        condition: condition,
        body: body,
        _originalType: 'while_statement'
      };
    } catch (error) {
      console.error('Error parsing while loop:', error);
      return null;
    }
  }

  parseDoWhileLoop(node, context) {
    try {
      console.log(`DEBUG LoopsParser: Parsing do-while loop structure`);
      
      let condition = null;
      let body = [];
      
      // Extract condition using text parsing
      const text = node.text || '';
      const doWhileMatch = text.match(/do\s*\{[^}]*\}\s*while\s*\(\s*([^)]+)\s*\)\s*;/);
      
      if (doWhileMatch) {
        const condText = doWhileMatch[1].trim();
        console.log(`DEBUG LoopsParser: Extracted do-while condition: "${condText}"`);
        condition = this.parseForCondition(condText, context);
      }
      
      // Find the body
      let foundDo = false;
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        
        if (child.type === 'do') {
          foundDo = true;
          continue;
        }
        
        if (foundDo && child.type === 'compound_statement') {
          body = this.parseBlock(child, context);
          break;
        }
      }
      
      if (!condition) {
        condition = { type: 'literal', value: 'true', data_type: 'boolean' };
      }
      
      console.log(`DEBUG LoopsParser: Do-while loop parsed - cond: ${JSON.stringify(condition)}, body: ${body.length} statements`);
      
      return {
        type: 'loop_statement',
        loop_type: 'do_while',
        condition: condition,
        body: body,
        _originalType: 'do_statement'
      };
    } catch (error) {
      console.error('Error parsing do-while loop:', error);
      return null;
    }
  }

  parseBlock(compoundNode, context) {
    if (!compoundNode || compoundNode.type !== 'compound_statement') {
      console.log(`DEBUG LoopsParser: Not a compound statement, returning empty body`);
      return [];
    }
    
    const statements = [];
    
    console.log(`DEBUG LoopsParser: Parsing block with ${compoundNode.childCount} children`);
    
    for (let i = 0; i < compoundNode.childCount; i++) {
      const child = compoundNode.child(i);
      
      // Skip braces
      if (child.type === '{' || child.type === '}') {
        continue;
      }
      
      console.log(`DEBUG LoopsParser: Block child ${i}: ${child.type} - "${child.text.substring(0, 40)}..."`);
      
      // Try to parse this child with available parsers
      let parsed = null;
      
      if (context.parsers) {
        for (const [parserName, parser] of Object.entries(context.parsers)) {
          if (parser.canParse && parser.canParse(child)) {
            try {
              parsed = parser.parse(child, context);
              break;
            } catch (e) {
              console.warn(`Parser ${parserName} failed in loop body:`, e.message);
            }
          }
        }
      }
      
      if (parsed) {
        statements.push(parsed);
        console.log(`DEBUG LoopsParser: Successfully parsed ${child.type} as ${parsed.type}`);
      } else {
        console.log(`DEBUG LoopsParser: Could not parse ${child.type}, creating specialized node`);
        
        // Check if this is a printf call inside an expression_statement
        if (child.type === 'expression_statement' && child.text.includes('printf')) {
          const printNode = this.extractPrintfFromExpression(child, context);
          if (printNode) {
            statements.push(printNode);
            console.log(`DEBUG LoopsParser: Extracted printf as print_statement`);
            continue;
          }
        }
        
        // Check if this is an update expression (i++, count++)
        if (child.type === 'expression_statement' && (child.text.includes('++') || child.text.includes('--'))) {
          const updateNode = this.extractUpdateExpression(child, context);
          if (updateNode) {
            statements.push(updateNode);
            console.log(`DEBUG LoopsParser: Extracted update expression`);
            continue;
          }
        }
        
        // Fallback: create generic node
        statements.push({
          type: 'expression_statement',
          expression: {
            type: 'expression',
            value: child.text,
            data_type: 'unknown'
          },
          _position: {
            originalText: child.text
          }
        });
      }
    }
    
    console.log(`DEBUG LoopsParser: Block parsing complete - found ${statements.length} statements`);
    return statements;
  }

  extractPrintfFromExpression(exprNode, context) {
    try {
      const text = exprNode.text.trim();
      console.log(`DEBUG LoopsParser: Attempting to extract printf from: "${text}"`);
      
      // Match printf("format", args)
      const printfMatch = text.match(/printf\s*\(\s*"([^"]*)"\s*(?:,\s*(.+))?\s*\)\s*;/);
      if (printfMatch) {
        const formatString = printfMatch[1];
        const argsText = printfMatch[2] || '';
        
        console.log(`DEBUG LoopsParser: Found printf: format="${formatString}", args="${argsText}"`);
        
        // Parse arguments
        const args = [];
        if (argsText) {
          // Simple argument parsing - split by commas
          const argParts = argsText.split(',').map(arg => arg.trim());
          for (const arg of argParts) {
            if (arg) {
              // Check if it's an identifier
              if (/^[a-zA-Z_]\w*$/.test(arg)) {
                args.push({
                  type: 'identifier',
                  name: arg
                });
              } else if (/^-?\d+$/.test(arg)) {
                // Number literal
                args.push({
                  type: 'literal',
                  value: arg,
                  data_type: 'int'
                });
              } else {
                // Unknown
                args.push({
                  type: 'expression',
                  value: arg,
                  data_type: 'unknown'
                });
              }
            }
          }
        }
        
        // Create print statement
        const originalFormat = formatString;
        let cleanedFormat = originalFormat;
        
        // Handle escaped percent signs
        cleanedFormat = cleanedFormat.replace(/%%/g, '§§PERCENT§§');
        
        // Remove format specifiers
        const formatSpecifierPattern = /%[-+#0 ]*\d*(?:\.\d+)?(?:[hlLztj])?[diuoxXfFeEgGaAcspn]/g;
        cleanedFormat = cleanedFormat.replace(formatSpecifierPattern, '');
        
        // Restore literal percent signs
        cleanedFormat = cleanedFormat.replace(/§§PERCENT§§/g, '%');
        
        // Handle trailing newline
        const hasTrailingNewline = originalFormat.endsWith('\\n');
        
        // Remove trailing \n from cleaned string if present
        if (cleanedFormat.endsWith('\\n')) {
          cleanedFormat = cleanedFormat.substring(0, cleanedFormat.length - 2);
        }
        
        // Handle special cases for empty format strings with arguments
        if (cleanedFormat === '' && originalFormat.includes('%')) {
          if (originalFormat.trim().endsWith(' ') || originalFormat.includes('% ')) {
            cleanedFormat = ' ';
          }
        }
        
        console.log(`DEBUG LoopsParser: Cleaned format string: "${cleanedFormat}" from original: "${originalFormat}"`);
        
        return {
          type: 'print_statement',
          args: [
            {
              type: 'literal',
              value: cleanedFormat,
              data_type: 'String',
              originalFormat: originalFormat,
              hasTrailingNewline: hasTrailingNewline
            },
            ...args
          ],
          _position: {
            originalText: text
          }
        };
      }
      
      // Try without quotes match
      const simplePrintfMatch = text.match(/printf\s*\((.+)\)\s*;/);
      if (simplePrintfMatch) {
        const content = simplePrintfMatch[1].trim();
        return {
          type: 'print_statement',
          args: [{
            type: 'expression',
            value: content,
            data_type: 'unknown'
          }],
          _position: {
            originalText: text
          }
        };
      }
    } catch (error) {
      console.warn(`Failed to extract printf:`, error.message);
    }
    
    return null;
  }

  extractUpdateExpression(exprNode, context) {
    try {
      const text = exprNode.text.trim();
      console.log(`DEBUG LoopsParser: Attempting to extract update expression from: "${text}"`);
      
      // Match i++ or ++i
      const updateMatch = text.match(/^(\w+)(\+\+|--)\s*;$/);
      const prefixMatch = text.match(/^(\+\+|--)(\w+)\s*;$/);
      
      if (updateMatch) {
        // Postfix: i++
        const variable = updateMatch[1];
        const operator = updateMatch[2];
        
        return {
          type: 'expression_statement',
          expression: {
            type: 'update_expression',
            operator: operator,
            operand: {
              type: 'identifier',
              name: variable
            }
          },
          _position: {
            originalText: text
          }
        };
      } else if (prefixMatch) {
        // Prefix: ++i
        const operator = prefixMatch[1];
        const variable = prefixMatch[2];
        
        return {
          type: 'expression_statement',
          expression: {
            type: 'update_expression',
            operator: operator,
            operand: {
              type: 'identifier',
              name: variable
            }
          },
          _position: {
            originalText: text
          }
        };
      }
    } catch (error) {
      console.warn(`Failed to extract update expression:`, error.message);
    }
    
    return null;
  }
}

export default LoopsParser;