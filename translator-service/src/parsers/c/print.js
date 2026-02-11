// src/parsers/c/print.js - COMPLETE FIXED VERSION
import { CParserBase } from './parser-base.js';
import { PrintStatement } from '../../core/ast-nodes.js';

export class PrintParser extends CParserBase {
  canParse(node) {
    if (node.type !== 'call_expression') return false;
    
    // Check if it's printf
    if (node.children && node.children[0] && node.children[0].type === 'identifier') {
      return node.children[0].text === 'printf';
    }
    
    return false;
  }

  parse(node, context) {
    console.log(`DEBUG PrintParser: Parsing printf call with ${node.children?.length || 0} children`);
    
    const args = [];
    
    // Extract all arguments
    for (let i = 0; i < (node.children?.length || 0); i++) {
      const child = node.children[i];
      
      // Look for argument_list
      if (child.type === 'argument_list') {
        console.log(`DEBUG PrintParser: Found argument_list with ${child.children?.length || 0} children`);
        this.parseArguments(child, args, context);
        break;
      }
    }
    
    // Clean the format string and store original for reference
    if (args.length > 0 && args[0].type === 'literal' && args[0].data_type === 'String') {
      // Store original format string for the generator to use
      args[0].originalFormat = args[0].value;
      
      // Check if the format string ends with \n
      const hasTrailingNewline = args[0].value.endsWith('\\n');
      args[0].hasTrailingNewline = hasTrailingNewline;
      
      // Clean the format string (remove \n if present)
      let cleaned = this.cleanFormatString(args[0].value);
      
      // Remove trailing \n from cleaned string
      if (cleaned.endsWith('\\n')) {
        cleaned = cleaned.substring(0, cleaned.length - 2);
      }
      
      args[0].value = cleaned;
    }
    
    // IMPORTANT: Store the original node for position tracking
    const printNode = new PrintStatement(args);
    if (node._position) {
      printNode._position = { ...node._position };
    } else {
      printNode._position = {
        originalText: node.text
      };
    }
    
    return printNode;
  }

  parseArguments(argListNode, argsArray, context) {
    if (!argListNode || !argListNode.children) return;
    
    for (let i = 0; i < argListNode.children.length; i++) {
      const arg = argListNode.children[i];
      
      if (arg.type === '(' || arg.type === ')' || arg.type === ',') {
        continue;
      }
      
      console.log(`DEBUG PrintParser: Parsing argument ${i}: ${arg.type} - "${arg.text?.substring(0, 50)}..."`);
      
      const parsedArg = this.parseArgument(arg, context);
      if (parsedArg) {
        argsArray.push(parsedArg);
      }
    }
  }

  parseArgument(node, context) {
    if (!node) return null;
    
    console.log(`DEBUG PrintParser: Parsing argument type: ${node.type}, text: "${node.text?.substring(0, 50)}..."`);
    
    // ⭐⭐ CRITICAL FIX: Check for subscript_expression FIRST
    if (node.type === 'subscript_expression') {
      console.log(`DEBUG PrintParser: Processing subscript_expression: "${node.text}"`);
      return this.parseSubscriptExpression(node, context);
    }
    
    // Handle basic types
    if (node.type === 'number_literal') {
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
    } else if (node.type === 'identifier') {
      return {
        type: 'identifier',
        name: node.text
      };
    } else if (node.type === 'binary_expression' || 
               node.type === 'unary_expression' ||
               node.type === 'logical_expression' ||
               node.type === 'comparison_expression' ||
               node.type === 'bitwise_expression') {
      
      // Try to use the expression parsing from the base class
      try {
        const expr = this.parseExpression(node, context);
        if (expr) return expr;
      } catch (error) {
        console.warn(`PrintParser: Failed to parse expression:`, error);
      }
      
      // Fallback - create expression node
      return {
        type: 'expression',
        value: node.text || '',
        data_type: 'unknown'
      };
    } else if (node.type === 'conditional_expression') {
      // Handle ternary expressions
      return {
        type: 'expression',
        value: node.text || '',
        data_type: 'unknown'
      };
    }
    
    console.log(`DEBUG PrintParser: Unknown argument type: ${node.type}`);
    return null;
  }

  // Parse subscript expressions (array access)
  parseSubscriptExpression(node, context) {
    console.log(`DEBUG PrintParser: Parsing subscript expression: "${node.text}"`);
    
    // For multi-dimensional arrays like matrix[1][2], we might have nested subscript_expressions
    let arrayExpression = '';
    let indexExpression = '';
    
    // Try to parse the structure
    if (node.children) {
      // Look for array name and index
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        
        if (child.type === 'identifier') {
          // This is the array name
          arrayExpression = child.text;
        } else if (child.type === 'number_literal') {
          // This is the index
          indexExpression = child.text;
        } else if (child.type === 'subscript_expression') {
          // Nested subscript for multi-dimensional arrays
          // For something like matrix[1][2], this might be the outer [2]
          const nested = this.parseSubscriptExpression(child, context);
          if (nested && nested.value) {
            // For now, just use the text representation
            return {
              type: 'expression',
              value: node.text || '',
              data_type: 'unknown'
            };
          }
        } else if (child.type === '[' || child.type === ']') {
          continue; // Skip brackets
        }
      }
    }
    
    if (arrayExpression && indexExpression) {
      // Create a special array access node
      return {
        type: 'array_access',
        array: arrayExpression,
        index: indexExpression,
        value: `${arrayExpression}[${indexExpression}]`,
        data_type: 'unknown'
      };
    } else if (arrayExpression) {
      // Only have array name, no index (shouldn't happen)
      return {
        type: 'identifier',
        name: arrayExpression
      };
    } else {
      // Fallback - use text representation
      return {
        type: 'expression',
        value: node.text || '',
        data_type: 'unknown'
      };
    }
  }

  cleanFormatString(formatStr) {
    if (!formatStr) return '';
    
    console.log(`DEBUG: Cleaning format string: "${formatStr}"`);
    
    // First, handle escaped percent signs (%% -> placeholder)
    let result = formatStr.replace(/%%/g, '§§PERCENT§§');
    
    console.log(`DEBUG: After %% replacement: "${result}"`);
    
    // Match ALL format specifiers
    const formatSpecifierPattern = /%[-+#0 ]*\d*(?:\.\d+)?(?:[hlLztj])?[diuoxXfFeEgGaAcspn]/g;
    
    // Replace format specifiers with empty string
    result = result.replace(formatSpecifierPattern, '');
    
    console.log(`DEBUG: After removing format specifiers: "${result}"`);
    
    // Restore literal percent signs
    result = result.replace(/§§PERCENT§§/g, '%');
    
    // Trim the result
    result = result.trim();
    
    // Handle special cases for empty format strings with arguments
    if (result === '' && formatStr.includes('%')) {
      // If we removed everything but had format specifiers
      // Check if the original ended with space
      if (formatStr.trim().endsWith(' ') || formatStr.includes('% ')) {
        result = ' '; // Keep a space for cases like "%d "
      }
    }
    
    console.log(`DEBUG: Final cleaned string: "${result}"`);
    
    return result;
  }
}

export default PrintParser;