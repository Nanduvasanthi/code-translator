// src/parsers/c/variables.js - FIXED VERSION
import { CParserBase } from './parser-base.js';
import { VariableDeclaration } from '../../core/ast-nodes.js';

export class VariableParser extends CParserBase {
  canParse(node) {
    return node.type === 'declaration';
  }

  parse(node, context) {
    if (node.type === 'declaration') {
      return this.parseDeclaration(node, context);
    }
    return null;
  }

  parseDeclaration(node, context) {
    let dataType = '';
    let name = '';
    let value = null;
    let isArray = false;
    let arraySize = null;
    let arrayDimensions = [];
    let arrayInitializer = null;

    console.log(`DEBUG VariableParser: Parsing declaration: "${node.text?.substring(0, 50)}..."`);
    console.log(`DEBUG VariableParser: Node has ${node.children?.length || 0} children`);

    // Check for multi-dimensional array
    if (node.text && node.text.includes('{{')) {
      console.log(`DEBUG VariableParser: Detected multi-dimensional array, using regex fallback`);
      const result = this.parseMultiDimArrayWithRegex(node.text);
      if (result) {
        return result;
      }
    }

    // SPECIAL HANDLING FOR MULTIPLE DECLARATIONS: int i, j;
    if (node.text && node.text.includes(',')) {
      const openBraces = (node.text.match(/\{/g) || []).length;
      const closeBraces = (node.text.match(/\}/g) || []).length;
      
      if (openBraces === closeBraces && openBraces > 0) {
        console.log(`DEBUG VariableParser: Commas inside braces - likely array initialization`);
      } else {
        console.log(`DEBUG VariableParser: Detected multiple declarations, using special parser`);
        return this.parseMultipleDeclarations(node, context);
      }
    }

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childText = child.text || '';
        
        const typeKeywords = ['short', 'long', 'int', 'float', 'double', 'char', 'bool', '_Bool', 'unsigned', 'signed'];
        
        if (child.type === 'primitive_type' || 
            child.type === 'type_identifier' ||
            typeKeywords.includes(childText.toLowerCase())) {
          
          if (i + 1 < node.children.length) {
            const nextChild = node.children[i + 1];
            const nextText = nextChild.text || '';
            
            if (nextText === 'double' || nextText === 'int' || nextText === 'long') {
              dataType = childText + ' ' + nextText;
              i++;
            } else {
              dataType = childText;
            }
          } else {
            dataType = childText;
          }
        }
        
        if (child.type === 'array_declarator' || child.type === 'init_declarator') {
          const result = this.parseArrayOrInitDeclarator(child, dataType);
          name = result.name || name;
          value = result.value;
          isArray = result.isArray || isArray;
          arraySize = result.arraySize;
          arrayDimensions = result.arrayDimensions || arrayDimensions;
          arrayInitializer = result.arrayInitializer;
          break;
        }
      }
    }

    if (node.text && node.text.includes('?')) {
      return this.parseDeclarationWithTernary(node, dataType);
    }

    // Check for multi-dimensional arrays in regex fallback
    if ((!name || !dataType) && node.text) {
      const result = this.parseWithRegex(node.text, dataType);
      if (result) {
        dataType = result.dataType;
        name = result.name;
        value = result.value;
        isArray = result.isArray;
        arraySize = result.arraySize;
        arrayDimensions = result.arrayDimensions || arrayDimensions;
      }
    }

    if (!name) {
      console.log(`DEBUG VariableParser: Failed to extract name from declaration`);
      return null;
    }

    // Build array type string
    if (arrayDimensions.length > 0) {
      dataType += '[]'.repeat(arrayDimensions.length);
    } else if (isArray) {
      dataType += '[]';
    }

    // Create variable declaration
    const varDecl = new VariableDeclaration(name, dataType.trim(), value);
    
    if (isArray || arrayDimensions.length > 0) {
      varDecl.isArray = true;
      if (arraySize) varDecl.arraySize = arraySize;
      if (arrayDimensions.length > 0) {
        varDecl.arrayDimensions = arrayDimensions;
      }
      if (arrayInitializer) varDecl.arrayInitializer = arrayInitializer;
    }
    
    varDecl._position = {
      startLine: node.startPosition?.row || 0,
      endLine: node.endPosition?.row || 0,
      startColumn: node.startPosition?.column || 0,
      endColumn: node.endPosition?.column || 0,
      originalText: node.text
    };

    console.log(`DEBUG VariableParser: Created ${isArray ? 'array ' : ''}${name}: ${dataType}${arrayDimensions.length > 0 ? `[${arrayDimensions.join('][')}]` : arraySize ? `[${arraySize}]` : ''} = ${value ? JSON.stringify(value)?.substring(0, 100) || 'initializer' : 'null'}`);
    console.log(`DEBUG VariableParser: Value has elements: ${value?.value?.elements?.length || 0}`);
    return varDecl;
  }

  // Parse multi-dimensional arrays with regex
  parseMultiDimArrayWithRegex(text) {
    console.log(`DEBUG parseMultiDimArrayWithRegex: Parsing "${text.substring(0, 60)}..."`);
    
    // Pattern for multi-dimensional array: type name[dim1][dim2] = {{...},{...}};
    const pattern = /^(\w+(?:\s+\w+)*)\s+(\w+)((?:\[\d*\])+)\s*=\s*\{([\s\S]*?)\}\s*;$/;
    const match = text.match(pattern);
    
    if (!match) {
      console.log(`DEBUG parseMultiDimArrayWithRegex: No match found`);
      return null;
    }
    
    const dataType = match[1];
    const name = match[2];
    const dimString = match[3];
    const initText = match[4];
    
    // Extract dimensions
    const dimMatches = dimString.match(/\[(\d*)\]/g);
    const arrayDimensions = dimMatches ? dimMatches.map(dim => {
      const sizeMatch = dim.match(/\[(\d*)\]/);
      return sizeMatch[1] || '';
    }) : [];
    
    console.log(`DEBUG parseMultiDimArrayWithRegex: Found ${name}: ${dataType}${dimString} with init text length ${initText.length}`);
    
    // Parse the nested array initialization
    const elements = this.parseNestedArrayInitializer(initText, dataType);
    
    // Create array initializer
    const arrayInitializer = {
      type: 'initializer_list',
      elements: elements
    };
    
    // Build final type
    let finalDataType = dataType;
    if (arrayDimensions.length > 0) {
      finalDataType += '[]'.repeat(arrayDimensions.length);
    }
    
    const value = {
      type: 'array_initializer',
      value: arrayInitializer,
      data_type: finalDataType
    };
    
    const varDecl = new VariableDeclaration(name, finalDataType.trim(), value);
    varDecl.isArray = true;
    varDecl.arrayDimensions = arrayDimensions;
    varDecl.arrayInitializer = arrayInitializer;
    
    if (arrayDimensions.length > 0 && arrayDimensions[0]) {
      varDecl.arraySize = arrayDimensions[0];
    }
    
    varDecl._position = {
      startLine: 0,
      endLine: 0,
      startColumn: 0,
      endColumn: 0,
      originalText: text
    };
    
    console.log(`DEBUG parseMultiDimArrayWithRegex: Created ${name}: ${finalDataType} with ${elements.length} outer elements`);
    return varDecl;
  }

  // Parse nested array initializer {{...},{...}}
  parseNestedArrayInitializer(text, dataType) {
    console.log(`DEBUG parseNestedArrayInitializer: Parsing "${text.substring(0, 60)}..."`);
    
    const elements = [];
    let current = '';
    let braceDepth = 0;
    let inQuotes = false;
    let inChar = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '"' && !inChar) {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === "'" && !inQuotes) {
        inChar = !inChar;
        current += char;
      } else if (char === '{' && !inQuotes && !inChar) {
        braceDepth++;
        if (braceDepth === 1) {
          // Start of a new inner array
          current = '';
        } else {
          current += char;
        }
      } else if (char === '}' && !inQuotes && !inChar) {
        braceDepth--;
        if (braceDepth === 0) {
          // End of an inner array
          const innerArray = this.parseSingleArrayInitializer(current.trim(), dataType);
          if (innerArray) {
            elements.push(innerArray);
          }
          current = '';
        } else {
          current += char;
        }
      } else if (char === ',' && braceDepth === 0 && !inQuotes && !inChar) {
        // Skip commas between inner arrays
        continue;
      } else {
        current += char;
      }
    }
    
    // Handle any remaining content
    if (current.trim() && braceDepth === 0) {
      const innerArray = this.parseSingleArrayInitializer(current.trim(), dataType);
      if (innerArray) {
        elements.push(innerArray);
      }
    }
    
    console.log(`DEBUG parseNestedArrayInitializer: Found ${elements.length} inner arrays`);
    return elements;
  }

  // Parse single array initializer {1, 2, 3}
  parseSingleArrayInitializer(text, dataType) {
    console.log(`DEBUG parseSingleArrayInitializer: Parsing "${text}"`);
    
    const elements = [];
    let current = '';
    let inQuotes = false;
    let inChar = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '"' && !inChar) {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === "'" && !inQuotes) {
        inChar = !inChar;
        current += char;
      } else if (char === ',' && !inQuotes && !inChar) {
        if (current.trim()) {
          this.addArrayElement(elements, current.trim(), dataType);
        }
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last element
    if (current.trim()) {
      this.addArrayElement(elements, current.trim(), dataType);
    }
    
    return {
      type: 'initializer_list',
      elements: elements
    };
  }

  // Helper to add array element
  addArrayElement(elements, value, dataType) {
    const trimmed = value.trim();
    
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      elements.push({
        type: 'string_literal',
        value: trimmed,
        data_type: 'char*'
      });
    } else if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      elements.push({
        type: 'char_literal',
        value: trimmed,
        data_type: 'char'
      });
    } else if (/^-?\d+$/.test(trimmed)) {
      elements.push({
        type: 'literal',
        value: trimmed,
        data_type: 'int'
      });
    } else if (/^-?\d*\.\d+$/.test(trimmed) || /^-?\d+\.\d*$/.test(trimmed)) {
      elements.push({
        type: 'literal',
        value: trimmed,
        data_type: 'float'
      });
    } else {
      elements.push({
        type: 'literal',
        value: trimmed,
        data_type: dataType.includes('char') ? 'char' : 'int'
      });
    }
  }

  parseArrayOrInitDeclarator(node, dataType) {
    let name = '';
    let value = null;
    let isArray = false;
    let arraySize = null;
    let arrayDimensions = [];
    let arrayInitializer = null;

    console.log(`DEBUG VariableParser: Parsing ${node.type}`);

    if (node.type === 'array_declarator') {
      isArray = true;
      const result = this.parseArrayDeclaratorDetails(node);
      name = result.name;
      arraySize = result.size;
      if (name.includes('[') && name.includes(']')) {
        const dimMatches = name.match(/\[(\d*)\]/g);
        if (dimMatches) {
          arrayDimensions = dimMatches.map(dim => {
            const sizeMatch = dim.match(/\[(\d*)\]/);
            return sizeMatch[1] || '';
          });
          const nameMatch = name.match(/^([^\[\]]+)/);
          if (nameMatch) {
            name = nameMatch[1];
          }
        }
      }
    }
    
    else if (node.type === 'init_declarator') {
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          
          if (child.type === 'array_declarator') {
            isArray = true;
            const arrayResult = this.parseArrayDeclaratorDetails(child);
            name = arrayResult.name;
            arraySize = arrayResult.size;
            
            if (name.includes('[') && name.includes(']')) {
              const dimMatches = name.match(/\[(\d*)\]/g);
              if (dimMatches) {
                arrayDimensions = dimMatches.map(dim => {
                  const sizeMatch = dim.match(/\[(\d*)\]/);
                  return sizeMatch[1] || '';
                });
                const nameMatch = name.match(/^([^\[\]]+)/);
                if (nameMatch) {
                  name = nameMatch[1];
                }
              }
            }
          }
          else if (child.type === 'identifier' && !name) {
            name = child.text;
          }
          else if (child.type === 'initializer_list' || child.type === 'array_initializer') {
            isArray = true;
            
            // FIXED: Properly handle array initializers
            const initText = child.text || '';
            console.log(`DEBUG parseArrayOrInitDeclarator: Found ${child.type} with text="${initText.substring(0, 50)}..."`);
            
            // Check if it's a nested array
            if (initText.includes('{{')) {
              console.log(`DEBUG: Using nested array parser for multi-dimensional array`);
              const nestedElements = this.parseNestedArrayInitializer(initText, dataType);
              console.log(`DEBUG: parseNestedArrayInitializer returned ${nestedElements.length} elements`);
              arrayInitializer = {
                type: 'initializer_list',
                elements: nestedElements
              };
            } else {
              // Regular array
              arrayInitializer = this.parseInitializerList(child);
              console.log(`DEBUG: parseInitializerList returned with ${arrayInitializer.elements?.length || 0} elements`);
            }
            
            // FIXED: Ensure elements are properly attached
            if (arrayInitializer && !arrayInitializer.elements) {
              console.log(`DEBUG: WARNING - arrayInitializer has no elements property!`);
              arrayInitializer.elements = [];
            }
            
            value = {
              type: 'array_initializer',
              value: arrayInitializer,
              data_type: dataType + '[]'
            };
            
            console.log(`DEBUG: Final value object has ${value.value?.elements?.length || 0} elements`);
          }
          else if (child.type === 'string_literal') {
            isArray = dataType === 'char' || dataType.includes('char');
            value = {
              type: 'string_literal',
              value: child.text,
              data_type: isArray ? dataType + '[]' : dataType
            };
          }
          else if (child.type === '=') {
            const nextChild = node.children[i + 1];
            if (nextChild) {
              if (nextChild.type === 'number_literal' || 
                  nextChild.type === 'char_literal' ||
                  nextChild.type === 'true' || 
                  nextChild.type === 'false') {
                
                let val = nextChild.text;
                
                if (val.startsWith("'") && val.endsWith("'")) {
                  val = val;
                }
                
                value = {
                  type: 'literal',
                  value: val,
                  data_type: dataType
                };
              } else if (nextChild.type === 'identifier') {
                value = {
                  type: 'identifier',
                  name: nextChild.text
                };
              }
            }
          }
        }
      }
    }

    return { name, value, isArray, arraySize, arrayDimensions, arrayInitializer };
  }

  parseArrayDeclaratorDetails(node) {
    let name = '';
    let size = null;

    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'identifier') {
          name = child.text;
        } else if (child.type === 'number_literal') {
          size = child.text;
        } else if (child.type === '[' || child.type === ']') {
          continue;
        }
      }
    }

    return { name, size };
  }

  // FIXED: parseInitializerList method
  parseInitializerList(node) {
    console.log(`DEBUG parseInitializerList: Node type="${node.type}", text="${node.text?.substring(0, 50)}..."`);
    
    const elements = [];
    
    if (node.children) {
      console.log(`DEBUG parseInitializerList: Has ${node.children.length} children`);
      
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childText = child.text || '';
        
        console.log(`DEBUG parseInitializerList: Child ${i} type="${child.type}", text="${childText.substring(0, 20)}..."`);
        
        if (child.type === '{' || child.type === '}' || child.type === ',') {
          continue;
        }
        
        if (child.type === 'number_literal') {
          elements.push({
            type: 'literal',
            value: childText,
            data_type: 'int'
          });
        } else if (child.type === 'char_literal') {
          elements.push({
            type: 'char_literal',
            value: childText,
            data_type: 'char'
          });
        } else if (child.type === 'string_literal') {
          elements.push({
            type: 'string_literal',
            value: childText,
            data_type: 'char*'
          });
        } else if (child.type === 'initializer_list') {
          console.log(`DEBUG parseInitializerList: Found nested initializer_list`);
          const nestedInitializer = this.parseInitializerList(child);
          console.log(`DEBUG parseInitializerList: Nested initializer has ${nestedInitializer.elements?.length || 0} elements`);
          
          // FIXED: Wrap nested array properly
          elements.push({
            type: 'array_initializer',
            value: nestedInitializer,
            data_type: 'unknown[]'
          });
        } else if (child.type === 'identifier') {
          elements.push({
            type: 'identifier',
            name: childText,
            data_type: 'unknown'
          });
        }
      }
    }
    
    // FIXED: Also parse from text if no children but text exists
    if (elements.length === 0 && node.text) {
      const cleanText = node.text.replace(/[\{\}]/g, '').trim();
      if (cleanText) {
        const parts = cleanText.split(',').map(p => p.trim()).filter(p => p);
        for (const part of parts) {
          if (part.startsWith('"') && part.endsWith('"')) {
            elements.push({
              type: 'string_literal',
              value: part,
              data_type: 'char*'
            });
          } else if (part.startsWith("'") && part.endsWith("'")) {
            elements.push({
              type: 'char_literal',
              value: part,
              data_type: 'char'
            });
          } else if (/^-?\d+$/.test(part)) {
            elements.push({
              type: 'literal',
              value: part,
              data_type: 'int'
            });
          } else if (/^-?\d*\.\d+$/.test(part)) {
            elements.push({
              type: 'literal',
              value: part,
              data_type: 'float'
            });
          }
        }
      }
    }
    
    console.log(`DEBUG parseInitializerList: Returning ${elements.length} elements:`, 
                elements.map(e => e.type === 'array_initializer' ? `[nested array]` : e.value).join(', '));
    
    return {
      type: 'initializer_list',
      elements: elements
    };
  }

  // Handle multiple declarations
  parseMultipleDeclarations(node, context) {
    const declarations = [];
    
    console.log(`DEBUG VariableParser: Parsing multiple declarations: ${node.text}`);
    
    // First try to parse as string array
    const stringArrayMatch = node.text.match(/^(\w+\s*\*)\s+(\w+)\[\]\s*=\s*\{([\s\S]*?)\};$/);
    if (stringArrayMatch) {
      console.log(`DEBUG VariableParser: Detected string array declaration`);
      
      const dataType = stringArrayMatch[1].trim();
      const name = stringArrayMatch[2];
      const elementsStr = stringArrayMatch[3];
      
      const elements = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < elementsStr.length; i++) {
        const char = elementsStr[i];
        if (char === '"') {
          inQuotes = !inQuotes;
          current += char;
        } else if (char === ',' && !inQuotes) {
          if (current.trim()) {
            elements.push({
              type: 'string_literal',
              value: current.trim(),
              data_type: 'char*'
            });
          }
          current = '';
        } else {
          current += char;
        }
      }
      
      if (current.trim()) {
        elements.push({
          type: 'string_literal',
          value: current.trim(),
          data_type: 'char*'
        });
      }
      
      const arrayInitializer = {
        type: 'initializer_list',
        elements: elements
      };
      
      const varDecl = new VariableDeclaration(name, dataType + '[]', {
        type: 'array_initializer',
        value: arrayInitializer,
        data_type: dataType + '[]'
      });
      
      varDecl.isArray = true;
      varDecl.arrayInitializer = arrayInitializer;
      
      varDecl._position = {
        startLine: node.startPosition?.row || 0,
        endLine: node.endPosition?.row || 0,
        startColumn: node.startPosition?.column || 0,
        endColumn: node.endPosition?.column || 0,
        originalText: node.text
      };
      
      console.log(`DEBUG VariableParser: Created string array ${name}: ${dataType}[] with ${elements.length} elements`);
      return [varDecl];
    }
    
    // Try array with size
    const arrayInitMatch = node.text.match(/^(\w+(?:\s+\w+)*)\s+(\w+)\[(\d*)\]\s*=\s*\{([\s\S]*?)\};$/);
    
    if (arrayInitMatch) {
      console.log(`DEBUG VariableParser: Detected array initialization with size`);
      
      const dataType = arrayInitMatch[1];
      const name = arrayInitMatch[2];
      const size = arrayInitMatch[3] || null;
      const elementsStr = arrayInitMatch[4];
      
      const elements = this.parseArrayElementsFromString(elementsStr, dataType);
      
      const arrayInitializer = {
        type: 'initializer_list',
        elements: elements
      };
      
      const varDecl = new VariableDeclaration(name, dataType + '[]', {
        type: 'array_initializer',
        value: arrayInitializer,
        data_type: dataType + '[]'
      });
      
      varDecl.isArray = true;
      if (size) varDecl.arraySize = size;
      varDecl.arrayInitializer = arrayInitializer;
      
      varDecl._position = {
        startLine: node.startPosition?.row || 0,
        endLine: node.endPosition?.row || 0,
        startColumn: node.startPosition?.column || 0,
        endColumn: node.endPosition?.column || 0,
        originalText: node.text
      };
      
      console.log(`DEBUG VariableParser: Created array ${name}: ${dataType}[${size || ''}] with ${elements.length} elements`);
      return [varDecl];
    }
    
    // Try array without size
    const arrayNoSizeMatch = node.text.match(/^(\w+(?:\s+\w+)*)\s+(\w+)\[\]\s*=\s*\{([\s\S]*?)\};$/);
    
    if (arrayNoSizeMatch) {
      console.log(`DEBUG VariableParser: Detected array initialization without size`);
      
      const dataType = arrayNoSizeMatch[1];
      const name = arrayNoSizeMatch[2];
      const elementsStr = arrayNoSizeMatch[3];
      
      const elements = this.parseArrayElementsFromString(elementsStr, dataType);
      
      const arrayInitializer = {
        type: 'initializer_list',
        elements: elements
      };
      
      const varDecl = new VariableDeclaration(name, dataType + '[]', {
        type: 'array_initializer',
        value: arrayInitializer,
        data_type: dataType + '[]'
      });
      
      varDecl.isArray = true;
      varDecl.arrayInitializer = arrayInitializer;
      
      varDecl._position = {
        startLine: node.startPosition?.row || 0,
        endLine: node.endPosition?.row || 0,
        startColumn: node.startPosition?.column || 0,
        endColumn: node.endPosition?.column || 0,
        originalText: node.text
      };
      
      console.log(`DEBUG VariableParser: Created array ${name}: ${dataType}[] with ${elements.length} elements`);
      return [varDecl];
    }
    
    // Parse multiple simple variables
    const typeMatch = node.text.match(/^(\w+(?:\s+\w+)*)\s+/);
    if (!typeMatch) {
      console.log(`DEBUG VariableParser: Could not extract type from multiple declarations`);
      return null;
    }
    
    const baseType = typeMatch[1];
    let rest = node.text.substring(typeMatch[0].length).replace(/;$/, '');
    
    const variableParts = [];
    let currentPart = '';
    let braceDepth = 0;
    
    for (let i = 0; i < rest.length; i++) {
      const char = rest[i];
      if (char === '{') {
        braceDepth++;
        currentPart += char;
      } else if (char === '}') {
        braceDepth--;
        currentPart += char;
      } else if (char === ',' && braceDepth === 0) {
        if (currentPart.trim()) {
          variableParts.push(currentPart.trim());
        }
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    
    if (currentPart.trim()) {
      variableParts.push(currentPart.trim());
    }
    
    console.log(`DEBUG VariableParser: Found ${variableParts.length} variables: ${variableParts.join(' | ')}`);
    
    for (const varPart of variableParts) {
      let dataType = baseType;
      let cleanName = varPart;
      let value = null;
      let isArray = false;
      let arraySize = null;
      let arrayDimensions = [];
      
      const arrayMatch = varPart.match(/^(\w+)((?:\[\d*\])+)?(?:\s*=\s*(.+))?$/);
      if (arrayMatch) {
        cleanName = arrayMatch[1];
        if (arrayMatch[2]) {
          isArray = true;
          const dimMatches = arrayMatch[2].match(/\[(\d*)\]/g);
          if (dimMatches) {
            arrayDimensions = dimMatches.map(dim => {
              const sizeMatch = dim.match(/\[(\d*)\]/);
              return sizeMatch[1] || '';
            });
          }
          if (arrayDimensions.length > 0) {
            arraySize = arrayDimensions[0];
          }
        }
        
        if (arrayMatch[3]) {
          const initValue = arrayMatch[3].trim();
          value = this.parseInitializationValue(initValue, dataType);
        }
      }
      
      else if (varPart.includes('=')) {
        const parts = varPart.split('=').map(part => part.trim());
        cleanName = parts[0];
        const valText = parts[1];
        value = this.parseInitializationValue(valText, dataType);
      }
      
      if (isArray) {
        if (arrayDimensions.length > 0) {
          dataType += '[]'.repeat(arrayDimensions.length);
        } else {
          dataType += '[]';
        }
      }
      
      const varDecl = new VariableDeclaration(cleanName, dataType, value);
      
      if (isArray) {
        varDecl.isArray = true;
        if (arraySize) varDecl.arraySize = arraySize;
        if (arrayDimensions.length > 0) {
          varDecl.arrayDimensions = arrayDimensions;
        }
      }
      
      varDecl._position = {
        startLine: node.startPosition?.row || 0,
        endLine: node.endPosition?.row || 0,
        startColumn: node.startPosition?.column || 0,
        endColumn: node.endPosition?.column || 0,
        originalText: node.text
      };
      
      declarations.push(varDecl);
    }
    
    return declarations;
  }

  parseArrayElementsFromString(elementsStr, dataType) {
    const elements = [];
    let current = '';
    let inQuotes = false;
    let inChar = false;
    
    for (let i = 0; i < elementsStr.length; i++) {
      const char = elementsStr[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === "'") {
        inChar = !inChar;
        current += char;
      } else if (char === ',' && !inQuotes && !inChar) {
        if (current.trim()) {
          this.addArrayElement(elements, current.trim(), dataType);
        }
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      this.addArrayElement(elements, current.trim(), dataType);
    }
    
    return elements;
  }

  parseInitializationValue(valueText, dataType) {
    const trimmed = valueText.trim();
    
    if (/^-?\d+$/.test(trimmed)) {
      return {
        type: 'literal',
        value: trimmed,
        data_type: 'int'
      };
    } else if (/^-?\d*\.\d+$/.test(trimmed) || /^-?\d+\.\d*$/.test(trimmed)) {
      return {
        type: 'literal',
        value: trimmed,
        data_type: 'float'
      };
    } else if (trimmed === 'true' || trimmed === 'false') {
      return {
        type: 'literal',
        value: trimmed,
        data_type: 'bool'
      };
    } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return {
        type: 'string_literal',
        value: trimmed,
        data_type: dataType.includes('char') ? 'char*' : 'string'
      };
    } else if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return {
        type: 'char_literal',
        value: trimmed,
        data_type: 'char'
      };
    } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      // Handle array initialization
      const innerText = trimmed.substring(1, trimmed.length - 1).trim();
      
      if (trimmed.includes('{{')) {
        // Multi-dimensional array
        const elements = this.parseNestedArrayInitializer(innerText, dataType);
        return {
          type: 'array_initializer',
          value: {
            type: 'initializer_list',
            elements: elements
          },
          data_type: dataType + '[]'
        };
      } else {
        // Simple array
        const elements = this.parseArrayElementsFromString(innerText, dataType);
        return {
          type: 'array_initializer',
          value: {
            type: 'initializer_list',
            elements: elements
          },
          data_type: dataType + '[]'
        };
      }
    } else if (/^[a-zA-Z_]\w*$/.test(trimmed)) {
      return {
        type: 'identifier',
        name: trimmed
      };
    } else {
      return {
        type: 'expression',
        value: trimmed,
        data_type: 'unknown'
      };
    }
  }

  parseWithRegex(text, currentType) {
    // Try multi-dimensional array first
    const multiDimArrayMatch = text.match(/^(\w+(?:\s+\w+)*)\s+(\w+)((?:\[\d*\])+)\s*=\s*(\{.+\}|[^;]+);/);
    if (multiDimArrayMatch) {
      const dataType = multiDimArrayMatch[1];
      const name = multiDimArrayMatch[2];
      const dimString = multiDimArrayMatch[3];
      const initValue = multiDimArrayMatch[4];
      
      const arrayDimensions = [];
      if (dimString) {
        const dimMatches = dimString.match(/\[(\d*)\]/g);
        if (dimMatches) {
          arrayDimensions.push(...dimMatches.map(dim => {
            const sizeMatch = dim.match(/\[(\d*)\]/);
            return sizeMatch[1] || '';
          }));
        }
      }
      
      return {
        dataType: dataType,
        name: name,
        isArray: true,
        arraySize: arrayDimensions.length > 0 ? arrayDimensions[0] : null,
        arrayDimensions: arrayDimensions,
        value: this.parseInitializationValue(initValue.trim(), dataType)
      };
    }
    
    // Try string array
    const stringArrayMatch = text.match(/^(\w+\s*\*)\s+(\w+)\[\]\s*=\s*\{([\s\S]*?)\};/);
    if (stringArrayMatch) {
      const dataType = stringArrayMatch[1].trim();
      const name = stringArrayMatch[2];
      const elementsStr = stringArrayMatch[3];
      
      const elements = this.parseArrayElementsFromString(elementsStr, dataType);
      
      const arrayInitializer = {
        type: 'initializer_list',
        elements: elements
      };
      
      return {
        dataType: dataType + '[]',
        name: name,
        isArray: true,
        arraySize: null,
        arrayDimensions: [],
        value: {
          type: 'array_initializer',
          value: arrayInitializer,
          data_type: dataType + '[]'
        }
      };
    }
    
    // Try regular array with size
    const arrayMatch = text.match(/^(\w+(?:\s+\w+)*)\s+(\w+)\[(\d*)\]\s*=\s*(\{.+\}|".*"|'.*'|[^;]+);/);
    if (arrayMatch) {
      return {
        dataType: arrayMatch[1],
        name: arrayMatch[2],
        isArray: true,
        arraySize: arrayMatch[3] || null,
        value: this.parseInitializationValue(arrayMatch[4].trim(), arrayMatch[1])
      };
    }
    
    // Try array without size
    const arrayNoSizeMatch = text.match(/^(\w+(?:\s+\w+)*)\s+(\w+)\[\]\s*=\s*(\{.+\}|".*"|[^;]+);/);
    if (arrayNoSizeMatch) {
      return {
        dataType: arrayNoSizeMatch[1],
        name: arrayNoSizeMatch[2],
        isArray: true,
        arraySize: null,
        value: this.parseInitializationValue(arrayNoSizeMatch[3].trim(), arrayNoSizeMatch[1])
      };
    }
    
    // Try simple variable
    const varMatch = text.match(/^(\w+(?:\s+\w+)*)\s+(\w+)\s*=\s*(.+?)\s*;/);
    if (varMatch) {
      return {
        dataType: varMatch[1],
        name: varMatch[2],
        isArray: false,
        value: this.parseInitializationValue(varMatch[3].trim(), varMatch[1])
      };
    }
    
    return null;
  }

  parseDeclarationWithTernary(node, dataType) {
    console.log(`DEBUG VariableParser: Parsing declaration with ternary: ${node.text}`);
    
    const match = node.text.match(/(\w+(?:\s*\*)?)\s+(\w+)\s*=\s*(.+?)\s*;/);
    if (match) {
      dataType = match[1];
      const name = match[2];
      const exprText = match[3];
      
      const varDecl = new VariableDeclaration(name, dataType.trim(), {
        type: 'expression',
        value: exprText,
        data_type: 'unknown'
      });
      
      varDecl._position = {
        startLine: node.startPosition?.row || 0,
        endLine: node.endPosition?.row || 0,
        startColumn: node.startPosition?.column || 0,
        endColumn: node.endPosition?.column || 0,
        originalText: node.text
      };

      return varDecl;
    }
    
    return null;
  }
}

export default VariableParser;