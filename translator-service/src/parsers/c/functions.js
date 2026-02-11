import { 
  FunctionDeclaration, 
  CallExpression, 
  ReturnStatement,
  IncludeStatement 
} from '../../core/ast-nodes.js';
import { CParserBase } from './parser-base.js';

export class FunctionsParser extends CParserBase {
  canParse(node) {
    return node.type === 'function_definition' || 
           node.type === 'call_expression' ||
           node.type === 'return_statement' ||
           node.type === 'preproc_include';
  }

  parse(node, context) {
    switch (node.type) {
      case 'function_definition':
        return this.parseFunctionDefinition(node, context);
      case 'call_expression':
        return this.parseCallExpression(node, context);
      case 'return_statement':
        return this.parseReturnStatement(node, context);
      case 'preproc_include':
        return this.parseIncludeStatement(node, context);
      default:
        return null;
    }
  }

  parseFunctionDefinition(node, context) {
    let name = '';
    let returnType = 'void';
    const parameters = [];
    
    // Extract return type and name
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'primitive_type' || child.type === 'type_identifier') {
        returnType = child.text;
      } else if (child.type === 'function_declarator') {
        name = this.extractFunctionName(child);
        parameters.push(...this.extractParameters(child));
      }
    }
    
    // Extract function body
    const body = this.extractFunctionBody(node);
    
    // Add function to context
    context.addFunction(name, returnType, parameters);
    
    return new FunctionDeclaration(name, returnType, parameters, body);
  }

  extractFunctionName(node) {
    // Look for identifier in declarator -> direct_declarator
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'direct_declarator') {
        for (let j = 0; j < child.childCount; j++) {
          const subChild = child.child(j);
          if (subChild.type === 'identifier') {
            return subChild.text;
          }
        }
      }
    }
    return '';
  }

  extractParameters(node) {
    const parameters = [];
    
    // Look for parameter list
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'parameter_list') {
        for (let j = 0; j < child.childCount; j++) {
          const param = child.child(j);
          if (param.type === 'parameter_declaration') {
            let paramType = 'int';
            let paramName = '';
            
            for (let k = 0; k < param.childCount; k++) {
              const paramChild = param.child(k);
              if (paramChild.type === 'primitive_type' || paramChild.type === 'type_identifier') {
                paramType = paramChild.text;
              } else if (paramChild.type === 'identifier') {
                paramName = paramChild.text;
              }
            }
            
            if (paramName) {
              parameters.push({ name: paramName, type: paramType });
            }
          }
        }
      }
    }
    
    return parameters;
  }

  extractFunctionBody(node) {
    const body = [];
    
    // Look for compound statement (function body)
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'compound_statement') {
        // Process statements in the body
        for (let j = 0; j < child.childCount; j++) {
          const stmt = child.child(j);
          if (stmt.type !== '{' && stmt.type !== '}') {
            // Add placeholder for statement
            body.push({ type: 'statement', node: stmt });
          }
        }
      }
    }
    
    return body;
  }

  parseCallExpression(node, context) {
    let functionName = '';
    const args = [];
    
    // Extract function name
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'identifier') {
        functionName = child.text;
      } else if (child.type === 'argument_list') {
        // Extract arguments
        for (let j = 0; j < child.childCount; j++) {
          const arg = child.child(j);
          if (arg.type !== '(' && arg.type !== ')') {
            args.push(this.extractExpression(arg));
          }
        }
      }
    }
    
    return new CallExpression(functionName, args);
  }

  extractExpression(node) {
    if (node.type === 'identifier' || node.type === 'number_literal' || 
        node.type === 'string_literal' || node.type === 'char_literal') {
      return node.text;
    }
    
    // For binary expressions, combine left and right
    if (node.type === 'binary_expression') {
      let left = '';
      let operator = '';
      let right = '';
      
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type === 'identifier' || child.type === 'number_literal') {
          if (!left) left = child.text;
          else right = child.text;
        } else if (['+', '-', '*', '/', '%'].includes(child.text)) {
          operator = child.text;
        }
      }
      
      return `${left} ${operator} ${right}`;
    }
    
    return node.text;
  }

  parseReturnStatement(node, context) {
    let value = '';
    
    // Extract return value
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type !== 'return' && child.type !== ';') {
        value = child.text;
      }
    }
    
    return new ReturnStatement(value);
  }

  parseIncludeStatement(node, context) {
    let header = '';
    
    // Extract header name
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'string_literal' || child.type === 'system_lib_string') {
        header = child.text.replace(/[<>"]/g, '');
      }
    }
    
    context.addWarning(`Include statement '#include <${header}>' ignored in Python translation`);
    return new IncludeStatement(header);
  }
}