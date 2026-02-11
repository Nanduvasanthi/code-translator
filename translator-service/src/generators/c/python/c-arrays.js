export class ArraysGenerator {
  canGenerate(astNode) {
    return astNode.type === 'array_declaration' || 
           astNode.type === 'array_access' ||
           astNode.type === 'array_assignment';
  }

  generate(astNode, context) {
    switch (astNode.type) {
      case 'array_declaration':
        return this.generateArrayDeclaration(astNode, context);
      case 'array_access':
        return this.generateArrayAccess(astNode, context);
      case 'array_assignment':
        return this.generateArrayAssignment(astNode, context);
      default:
        return '';
    }
  }

  generateArrayDeclaration(astNode, context) {
    console.log(`DEBUG ArrayGen: name=${astNode.name}, elementType=${astNode.elementType}, values=${JSON.stringify(astNode.values)}`);
    
    const elementType = this.mapParserTypeToC(astNode.elementType);
    console.log(`DEBUG ArrayGen: mapped type=${elementType}`);
    
    if (astNode.values && astNode.values.length > 0) {
      // For string arrays in C
      if (elementType === 'char*') {
        const values = astNode.values.map(v => {
          if (typeof v === 'object' && v.type === 'string') {
            return `"${v.value}"`;
          }
          if (typeof v === 'string') {
            return `"${v}"`;
          }
          return v;
        }).join(', ');
        
        return `char* ${astNode.name}[] = {${values}};`;
      } 
      // For numeric/other arrays
      else {
        const size = astNode.values.length;
        const values = astNode.values.map(v => {
          if (typeof v === 'object' && v.value !== undefined) {
            return v.value;
          }
          return v;
        }).join(', ');
        
        return `${elementType} ${astNode.name}[${size}] = {${values}};`;
      }
    } else {
      const size = astNode.size || 10;
      return `${elementType} ${astNode.name}[${size}];`;
    }
  }

  generateArrayAccess(astNode, context) {
  // Handle the index - it might be a string or number
  let index = astNode.index;
  
  // DEBUG: Log what we're getting
  console.log('DEBUG ArrayAccess:', {
    arrayName: astNode.arrayName,
    index: astNode.index,
    typeOfIndex: typeof astNode.index,
    isObject: typeof astNode.index === 'object'
  });
  
  // Check if index is a string or object with value property
  if (typeof index === 'object' && index.value !== undefined) {
    index = index.value;
    console.log('DEBUG: Extracted index value:', index);
  }
  
  // Convert to number for comparison
  const numericIndex = parseInt(index, 10);
  console.log('DEBUG: Numeric index:', numericIndex);
  
  // Check if it's negative
  if (numericIndex < 0 || (typeof index === 'string' && index.startsWith('-'))) {
    // Handle Python-style negative indexing in C
    // For array declaration, we need to get the size
    // Use sizeof(array)/sizeof(array[0]) to get length
    const result = `${astNode.arrayName}[sizeof(${astNode.arrayName})/sizeof(${astNode.arrayName}[0]) ${numericIndex}]`;
    console.log('DEBUG: Generated negative index access:', result);
    return result;
  }
  
  const result = `${astNode.arrayName}[${index}]`;
  console.log('DEBUG: Generated normal index access:', result);
  return result;
}

  generateArrayAssignment(astNode, context) {
    // Check if index is negative
    if (astNode.index < 0) {
      return `${astNode.arrayName}[sizeof(${astNode.arrayName})/sizeof(${astNode.arrayName}[0]) + ${astNode.index}] = ${astNode.value};`;
    }
    return `${astNode.arrayName}[${astNode.index}] = ${astNode.value};`;
  }

  mapParserTypeToC(parserType) {
    const typeMap = {
      'String': 'char*',
      'string': 'char*',
      'int': 'int',
      'float': 'float',
      'double': 'double',
      'char': 'char',
      'boolean': 'bool',
      'bool': 'bool',
      'Object': 'void*'
    };
    
    return typeMap[parserType] || 'int';
  }
}