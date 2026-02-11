// src/parsers/c/basic-syntax.js
import { VariableDeclaration, FunctionDeclaration } from '../../core/ast-nodes.js';
import { CParserBase } from './parser-base.js';

export class BasicSyntaxParser extends CParserBase {
  canParse(node) {
    return node.type === 'function_definition' || 
           node.type === 'preproc_include' ||
           node.type === 'expression_statement'; // ADDED
  }

  parse(node, context) {
    if (node.type === 'function_definition') {
      return this.parseFunction(node, context);
    } else if (node.type === 'preproc_include') {
      return this.parseInclude(node, context);
    } else if (node.type === 'expression_statement') {
      return this.parseExpressionStatement(node, context); // ADDED
    }
    return null;
  }

  // NEW METHOD: Handle expression_statement nodes
  parseExpressionStatement(node, context) {
  const text = node.text || '';
  console.log(`DEBUG BasicSyntaxParser: Parsing expression_statement: "${text}"`);
  
  // Skip printf statements (handled by print parser)
  if (text.includes('printf')) {
    return null;
  }
  
  // ⭐⭐ ADD THIS CHECK ⭐⭐
  // Skip assignment expressions (handled by OperatorsParser)
  if (text.includes('=') && !text.includes('printf')) {
    console.log(`DEBUG BasicSyntaxParser: Skipping assignment expression (handled by OperatorsParser): "${text}"`);
    return null;
  }
  
  // Remove the array assignment regex code entirely
  // Don't create array_assignment nodes
  
  // For other expressions, create expression_statement node
  return {
    type: 'expression_statement',
    code: text.trim(),
    _position: {
      startLine: node.startPosition?.row || 0,
      endLine: node.endPosition?.row || 0,
      startColumn: node.startPosition?.column || 0,
      endColumn: node.endPosition?.column || 0,
      originalText: text
    }
  };
}

  // Helper to parse values
  parseValue(valueStr) {
    if (/^\d+$/.test(valueStr)) {
      return {
        type: 'literal',
        value: valueStr,
        data_type: 'int'
      };
    } else if (/^'.'$/.test(valueStr)) {
      const charVal = valueStr.substring(1, valueStr.length - 1);
      return {
        type: 'char_literal',
        value: `'${charVal}'`,
        data_type: 'char'
      };
    } else if (/^".*"$/.test(valueStr)) {
      return {
        type: 'string_literal',
        value: valueStr,
        data_type: 'char[]'
      };
    } else if (/^\w+$/.test(valueStr)) {
      return {
        type: 'identifier',
        name: valueStr,
        data_type: 'unknown'
      };
    }
    
    return {
      type: 'unknown',
      value: valueStr,
      data_type: 'unknown'
    };
  }

  parseFunction(node, context) {
    console.log(`DEBUG BasicSyntaxParser: Parsing function: "${node.text?.substring(0, 50)}..."`);
    
    let returnType = 'void';
    let name = '';
    let body = [];
    
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        
        if (child.type === 'primitive_type' || child.type === 'type_identifier') {
          returnType = child.text;
        } else if (child.type === 'function_declarator') {
          if (child.children) {
            for (let j = 0; j < child.children.length; j++) {
              const subChild = child.children[j];
              if (subChild.type === 'identifier') {
                name = subChild.text;
                break;
              }
            }
          }
        } else if (child.type === 'compound_statement') {
          body = this.parseFunctionBody(child, context);
        }
      }
    }
    
    // Fallback regex
    if (!name && node.text) {
      const match = node.text.match(/(\w+)\s+(\w+)\s*\(/);
      if (match) {
        returnType = match[1];
        name = match[2];
      }
    }
    
    if (!name) return null;
    
    console.log(`DEBUG BasicSyntaxParser: Created function ${name} returning ${returnType} with ${body.length} body statements`);
    
    const funcDecl = new FunctionDeclaration(name, returnType, [], body);
    funcDecl._position = {
      startLine: node.startPosition?.row || 0,
      endLine: node.endPosition?.row || 0,
      originalText: node.text
    };
    
    return funcDecl;
  }

  parseFunctionBody(compoundNode, context) {
    const statements = [];
    
    if (!compoundNode || !compoundNode.children) return statements;
    
    console.log(`DEBUG BasicSyntaxParser: Parsing function body with ${compoundNode.children.length} children`);
    
    for (let i = 0; i < compoundNode.children.length; i++) {
      const child = compoundNode.children[i];
      
      if (child.type === '{' || child.type === '}') continue;
      
      console.log(`DEBUG BasicSyntaxParser: Processing child ${i}: ${child.type} - "${child.text?.substring(0, 40) || ''}..."`);
      
      // Let specialized parsers handle different node types
      if (context && context.parsers) {
        let parsed = null;
        
        for (const [parserName, parser] of Object.entries(context.parsers)) {
          if (parser && parser.canParse && parser.canParse(child)) {
            console.log(`DEBUG BasicSyntaxParser: Using parser ${parserName} for ${child.type}`);
            try {
              parsed = parser.parse(child, context);
              if (parsed) break;
            } catch (error) {
              console.warn(`DEBUG: Failed to parse ${child.type} with ${parserName}:`, error.message);
            }
          }
        }
        
        if (parsed) {
          if (Array.isArray(parsed)) {
            statements.push(...parsed);
          } else {
            parsed._position = parsed._position || {
              startLine: child.startPosition?.row || 0,
              originalText: child.text
            };
            statements.push(parsed);
          }
          console.log(`DEBUG BasicSyntaxParser: Added ${Array.isArray(parsed) ? 'multiple' : parsed.type} to function body`);
        }
      }
    }
    
    return statements;
  }

  parseInclude(node, context) {
    return {
      type: 'include_statement',
      header: node.text ? node.text.replace('#include', '').trim() : '',
      _position: {
        startLine: node.startPosition?.row || 0,
        originalText: node.text
      }
    };
  }
}

export default BasicSyntaxParser;