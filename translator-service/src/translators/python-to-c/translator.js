import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
import { TranslationContext } from './context.js';

// Import parsers (using the same parsers as python-to-java)
import { VariablesParser } from '../../parsers/python/variables.js';
import { PrintParser } from '../../parsers/python/print.js';
import { CommentsParser } from '../../parsers/python/comments.js';
import { OperatorsParser } from '../../parsers/python/operators.js';
import { ConditionalsParser } from '../../parsers/python/conditionals.js';
import { TernaryParser } from '../../parsers/python/ternary.js';
import { LoopsParser } from '../../parsers/python/loops.js';
import { ArraysParser } from '../../parsers/python/arrays.js';

// Import C generators
import { VariablesGenerator } from '../../generators/c/python/c-variables.js';
import { PrintGenerator } from '../../generators/c/python/c-print.js';
import { CommentsGenerator } from '../../generators/c/python/c-comments.js';
import { OperatorsGenerator } from '../../generators/c/python/c-operators.js';
import { ConditionalsGenerator } from '../../generators/c/python/c-control-flow.js';
import { TernaryGenerator } from '../../generators/c/python/c-ternary.js';
import { LoopsGenerator } from '../../generators/c/python/c-loops.js';
import { ArraysGenerator } from '../../generators/c/python/c-arrays.js';

export class PythonToCTranslator {
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Python);
    
    // Initialize parsers
    this.parsers = {
      arrays: new ArraysParser(),
      variables: new VariablesParser(),
      print: new PrintParser(),
      comments: new CommentsParser(),
      operators: new OperatorsParser(),
      conditionals: new ConditionalsParser(),
      ternary: new TernaryParser(),
      loops: new LoopsParser()
    };
    
    // Initialize C generators
    this.generators = {
      arrays: new ArraysGenerator(),
      variables: new VariablesGenerator(),
      print: new PrintGenerator(),
      comments: new CommentsGenerator(),
      operators: new OperatorsGenerator(),
      conditionals: new ConditionalsGenerator(),
      ternary: new TernaryGenerator(),
      loops: new LoopsGenerator()
    };
    
    this.processedLines = new Set();
  }

  translate(pythonCode) {
  try {
    const tree = this.parser.parse(pythonCode);
    const context = new TranslationContext();
    
    // Register parsers and generators
    for (const [name, parser] of Object.entries(this.parsers)) {
      context.registerParser(name, parser);
    }
    
    for (const [name, generator] of Object.entries(this.generators)) {
      context.registerGenerator(name, generator);
    }
    
    this.processedLines.clear();
    const inputLines = pythonCode.split('\n');
    const maxLineNum = inputLines.length - 1;
    
    const outputLines = [];
    const variableDeclarations = [];
    const declaredVariables = new Set();
    
    // Store lines with their original line numbers for proper spacing
    const lineMap = new Map();
    const allGeneratedCode = []; // Track all generated code to check for pow()
    
    for (let lineNum = 0; lineNum <= maxLineNum; lineNum++) {
      if (this.processedLines.has(lineNum)) {
        continue;
      }
      
      const inputLine = inputLines[lineNum];
      
      if (inputLine.trim() === '') {
        // Store empty line with its line number
        lineMap.set(lineNum, { type: 'empty', content: '' });
        continue;
      }
      
      const lineNodes = this.getNodesForLine(tree.rootNode, lineNum);
      
      if (lineNodes.length === 0) {
        if (inputLine.trim().startsWith('#')) {
          const commentText = inputLine.trim().substring(1).trim();
          lineMap.set(lineNum, { 
            type: 'comment', 
            content: `/* ${commentText} */` 
          });
        } else {
          lineMap.set(lineNum, { 
            type: 'unknown', 
            content: `/* ${inputLine} */` 
          });
        }
      } else {
        const hasIfStatement = lineNodes.some(n => n.type === 'if_statement');
        const hasLoopStatement = lineNodes.some(n => n.type === 'for_statement' || n.type === 'while_statement');
        
        if (hasIfStatement) {
          const ifNode = lineNodes.find(n => n.type === 'if_statement');
          const conditionalResult = this.processConditionalBlock(ifNode, context, lineNum);
          
          if (conditionalResult) {
            lineMap.set(lineNum, { 
              type: 'code', 
              content: conditionalResult.code 
            });
            allGeneratedCode.push(conditionalResult.code);
            conditionalResult.processedLines.forEach(l => this.processedLines.add(l));
          }
        } else if (hasLoopStatement) {
          const loopNode = lineNodes.find(n => n.type === 'for_statement' || n.type === 'while_statement');
          const loopResult = this.processLoopBlock(loopNode, context, lineNum);
          
          if (loopResult) {
            lineMap.set(lineNum, { 
              type: 'code', 
              content: loopResult.code 
            });
            allGeneratedCode.push(loopResult.code);
            loopResult.processedLines.forEach(l => this.processedLines.add(l));
          }
        } else {
          const lineResult = this.processLineNodes(lineNodes, context, lineNum);
          
          if (lineResult !== null) {
            // Check if this is a variable or array declaration
            const node = lineNodes.find(n => n.type === 'assignment');
            if (node) {
              const variableName = this.extractVariableName(node);
              
              if (variableName && !declaredVariables.has(variableName)) {
                // Check if this is an array (list) assignment
                const arraysParser = this.parsers.arrays;
                let isArray = false;
                let arrayCode = null;
                let cType = 'int'; // Default type
                
                if (arraysParser && arraysParser.canParse(node)) {
                  // This is an array assignment
                  isArray = true;
                  const astNode = arraysParser.parse(node, context);
                  const generator = this.generators.arrays;
                  
                  if (generator && generator.canGenerate(astNode)) {
                    arrayCode = generator.generate(astNode, context);
                    // Extract type from generated array code
                    const typeMatch = arrayCode.match(/^([a-zA-Z_*\[\]\s]+)\s+[a-zA-Z_]/);
                    if (typeMatch) {
                      cType = typeMatch[1].trim();
                    }
                  }
                }
                
                if (isArray && arrayCode) {
                  // Add array declaration to variableDeclarations
                  variableDeclarations.push({ 
                    name: variableName, 
                    type: cType, 
                    code: arrayCode,
                    originalLine: lineNum
                  });
                  
                  // Store in lineMap
                  lineMap.set(lineNum, { 
                    type: 'variable_decl', 
                    content: arrayCode,
                    name: variableName 
                  });
                  allGeneratedCode.push(arrayCode);
                } else {
                  // Regular variable assignment - parse with VariablesParser
                  const parser = this.parsers.variables;
                  if (parser && parser.canParse(node)) {
                    const astNode = parser.parse(node, context);
                    const generator = this.generators.variables;
                    
                    if (generator && generator.canGenerate(astNode)) {
                      // Generate the variable declaration
                      const generatedCode = generator.generate(astNode, context);
                      
                      // Extract type for declaration
                      cType = this.inferCTypeFromAST(astNode, context);
                      
                      // Add to declarations list
                      variableDeclarations.push({ 
                        name: variableName, 
                        type: cType, 
                        code: generatedCode,
                        originalLine: lineNum
                      });
                      
                      // Store the generated code in lineMap
                      lineMap.set(lineNum, { 
                        type: 'variable_decl', 
                        content: generatedCode,
                        name: variableName 
                      });
                      allGeneratedCode.push(generatedCode);
                    }
                  }
                }
                
                // Mark as declared
                declaredVariables.add(variableName);
                context.addVariable(variableName, cType);
              } else {
                // Variable already declared, just add the assignment
                lineMap.set(lineNum, { 
                  type: 'code', 
                  content: lineResult 
                });
                allGeneratedCode.push(lineResult);
              }
            } else {
              // Not a variable declaration, add directly to output
              lineMap.set(lineNum, { 
                type: 'code', 
                content: lineResult 
              });
              allGeneratedCode.push(lineResult);
            }
          } else {
            // Couldn't translate, add as comment
            lineMap.set(lineNum, { 
              type: 'unknown', 
              content: `/* ${inputLine} */` 
            });
          }
        }
      }
    }
    
    // Generate final C code
    return this.generateCCode(lineMap, variableDeclarations, context, allGeneratedCode);
    
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

  getNodesForLine(node, targetLine) {
    const nodes = [];
    
    const collect = (currentNode) => {
      const lineNum = currentNode.startPosition.row;
      
      if (lineNum === targetLine && this.isStatementLevelNode(currentNode)) {
        nodes.push(currentNode);
      }
      
      for (let i = 0; i < currentNode.childCount; i++) {
        collect(currentNode.child(i));
      }
    };
    
    collect(node);
    return nodes;
  }

  isStatementLevelNode(node) {
    const statementTypes = [
      'assignment',
      'expression_statement',
      'call',
      'comment',
      'if_statement',
      'elif_clause',
      'else_clause',
      'conditional_expression',
      'for_statement',
      'while_statement',
      'list',
      'function_definition'
    ];
    
    if (!statementTypes.includes(node.type)) {
      return false;
    }
    
    const parent = node.parent;
    if (!parent) return true;
    
    const parentTypes = ['module', 'block'];
    return parentTypes.includes(parent.type) || 
           (parent.type === 'expression_statement' && node.type !== 'expression_statement');
  }

  processConditionalBlock(ifNode, context, startLine) {
    const processedLines = new Set();
    this.markAllConditionalLines(ifNode, processedLines);
    
    const allClauses = this.collectAllConditionalClauses(ifNode);
    const parser = this.parsers.conditionals;
    
    if (parser.canParse(ifNode)) {
      const astNode = parser.parse(ifNode, context, allClauses);
      const generator = this.generators.conditionals;
      
      if (generator && generator.canGenerate(astNode)) {
        const code = generator.generate(astNode, context);
        return { code, processedLines };
      }
    }
    
    return null;
  }

  processLoopBlock(loopNode, context, startLine) {
    const processedLines = new Set();
    this.markAllLoopLines(loopNode, processedLines);
    
    const parser = this.parsers.loops;
    if (parser.canParse(loopNode)) {
      const astNode = parser.parse(loopNode, context);
      const generator = this.generators.loops;
      
      if (generator && generator.canGenerate(astNode)) {
        const code = generator.generate(astNode, context);
        return { code, processedLines };
      }
    }
    
    return null;
  }

  markAllLoopLines(node, processedLines) {
    const lineNum = node.startPosition.row;
    processedLines.add(lineNum);
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      this.markAllLoopLines(child, processedLines);
    }
  }

  markAllConditionalLines(node, processedLines) {
    const lineNum = node.startPosition.row;
    processedLines.add(lineNum);
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      this.markAllConditionalLines(child, processedLines);
    }
  }

  collectAllConditionalClauses(ifNode) {
    const clauses = [{ type: 'if', node: ifNode }];
    
    for (let i = 0; i < ifNode.childCount; i++) {
      const child = ifNode.child(i);
      
      if (child.type === 'elif_clause') {
        clauses.push({ type: 'elif', node: child });
      } else if (child.type === 'else_clause') {
        clauses.push({ type: 'else', node: child });
      }
    }
    
    return clauses;
  }

  processLineNodes(nodes, context, lineNum) {
  let codeOutput = '';
  let commentOutput = '';
  
  for (const node of nodes) {
    try {
      // First, check if this is an assignment that should be handled by ArraysParser
      if (node.type === 'assignment') {
        // Check if ArraysParser can handle this (list assignments)
        const arraysParser = this.parsers.arrays;
        if (arraysParser && arraysParser.canParse(node)) {
          const astNode = arraysParser.parse(node, context);
          const generator = this.generators.arrays;
          
          if (generator && generator.canGenerate(astNode)) {
            const translation = generator.generate(astNode, context);
            if (translation) {
              return translation; // Return immediately for array assignments
            }
          }
        }
        // If not an array, continue with normal translation flow
      }
      
      const translation = this.translateNode(node, context);
      
      if (translation) {
        if (node.type === 'comment') {
          commentOutput = translation.replace(/^\/\/\s*|\/\*\s*|\s*\*\//g, '');
        } else {
          codeOutput = translation;
        }
      }
    } catch (error) {
      console.warn(`Error translating node ${node.type} at line ${lineNum}:`, error.message);
    }
  }
  
  if (codeOutput && commentOutput) {
    return codeOutput + ' /* ' + commentOutput + ' */';
  } else if (codeOutput) {
    return codeOutput;
  } else if (commentOutput) {
    return '/* ' + commentOutput + ' */';
  }
  
  return null;
}


  translateNode(node, context) {
  let targetNode = node;
  if (node.type === 'expression_statement') {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type !== '\n' && child.type !== '' && child.type !== 'comment') {
        targetNode = child;
        break;
      }
    }
  }
  
  // ADD THIS DEBUG LOGGING:
  console.log('DEBUG translateNode: trying to translate node type:', targetNode.type, targetNode.text);
  
  for (const [parserName, parser] of Object.entries(this.parsers)) {
    if (parser.canParse(targetNode)) {
      // ADD THIS:
      console.log('DEBUG: parser', parserName, 'can parse this node');
      const astNode = parser.parse(targetNode, context);
      // ADD THIS:
      console.log('DEBUG: parser created astNode type:', astNode?.type, 'full ast:', astNode);
      const generator = this.generators[parserName];
      
      if (generator && generator.canGenerate(astNode)) {
        // ADD THIS:
        console.log('DEBUG: generator', parserName, 'can generate from astNode');
        const result = generator.generate(astNode, context);
        // ADD THIS:
        console.log('DEBUG: generator result:', result);
        return result;
      }
      break;
    }
  }
  
  console.log('DEBUG: No parser could handle node type:', targetNode.type);
  return null;
}

  extractVariableName(node) {
    if (node.type === 'assignment') {
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type === 'identifier') {
          return child.text;
        }
      }
    }
    return null;
  }

  inferCTypeFromAST(astNode, context) {
    if (!astNode || !astNode.data_type) return 'int';
    
    const typeMap = {
      'int': 'int',
      'float': 'float',
      'str': 'char*',
      'string': 'char*',
      'bool': 'bool',
      'boolean': 'bool',
      'list': 'int*',
      'array': 'int*',
      'Object': 'int'
    };
    
    return typeMap[astNode.data_type] || 'int';
  }

  generateCCode(lineMap, variableDeclarations, context, allGeneratedCode) {
  // Check if we need stdbool.h or math.h
  const needsStdbool = variableDeclarations.some(d => d.type === 'bool') || 
                      context.needsStdbool;
  
  // Check if any generated code contains pow() function
  const needsMath = allGeneratedCode.some(code => 
    code && code.includes && code.includes('pow(')
  );
  
  let cCode = '#include <stdio.h>\n';
  if (needsStdbool) {
    cCode += '#include <stdbool.h>\n';
  }
  if (needsMath) {
    cCode += '#include <math.h>\n';
  }
  cCode += '\n';
  
  // Start main function
  cCode += 'int main() {\n';
  
  // Add variable declarations - FIXED: Use the actual generated code
  const declarationSet = new Set();
  
  // First pass: output all variable declarations
  for (const decl of variableDeclarations) {
    if (!declarationSet.has(decl.name) && decl.code) {
      cCode += `    ${decl.code}\n`;
      declarationSet.add(decl.name);
    }
  }
  
  if (declarationSet.size > 0) {
    cCode += '\n';
  }
  
  // Sort lineMap by line number to preserve original order
  const sortedLines = Array.from(lineMap.entries())
    .sort((a, b) => a[0] - b[0]);
  
  // Output all code lines in original order
  // Skip variable_decl types as they were already declared
  let lastWasCode = false;
  
  for (const [lineNum, lineData] of sortedLines) {
    if (lineData.type === 'empty') {
      if (lastWasCode) {
        cCode += '\n';
      }
      lastWasCode = false;
    } else if (lineData.type === 'variable_decl') {
      // Skip - already output in declaration section
      lastWasCode = false;
    } else if (lineData.type === 'code' || lineData.type === 'comment' || lineData.type === 'unknown') {
      cCode += '    ' + lineData.content + '\n';
      lastWasCode = true;
    }
  }
  
  // Add a blank line before return if there was any code
  if (lastWasCode) {
    cCode += '\n';
  }
  
  // Add return statement
  cCode += '    return 0;\n';
  cCode += '}\n';
  
  return cCode;
}

}