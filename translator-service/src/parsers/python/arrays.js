export class ArraysParser {
  canParse(node) {
    // Check for list literal or list assignment
    return node.type === 'list' || 
           (node.type === 'assignment' && this.containsList(node));
  }

  containsList(node) {
    // Check if assignment contains a list
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'list') {
        return true;
      }
    }
    return false;
  }

  parse(node, context) {
    if (node.type === 'list') {
      return this.parseListLiteral(node, context);
    } else if (node.type === 'assignment') {
      return this.parseListAssignment(node, context);
    }
    return null;
  }

  parseListAssignment(node, context) {
    console.log('Parsing list assignment:', node.text);
    
    let name = '';
    let values = [];
    
    // Extract variable name and list values
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'identifier' && !name) {
        name = child.text;
      } else if (child.type === 'list') {
        values = this.parseListValues(child);
      }
    }
    
    // Determine element type from values
    const elementType = this.inferElementType(values);
    
    console.log(`List ${name}: values=${values.length}, elementType=${elementType}`);
    
    // Store in context with proper type (Java style)
    context.addVariable(name, elementType + '[]');
    
    return {
      type: 'array_declaration',
      name: name,
      elementType: elementType,
      values: values
    };
  }

  parseListLiteral(node, context) {
    console.log('Parsing list literal:', node.text);
    const values = this.parseListValues(node);
    const elementType = this.inferElementType(values);
    
    return {
      type: 'array_literal',
      elementType: elementType,
      values: values
    };
  }

  parseListValues(listNode) {
    const values = [];
    
    for (let i = 0; i < listNode.childCount; i++) {
      const child = listNode.child(i);
      
      if (child.type === 'string') {
        const text = child.text;
        let value = text;
        // Remove quotes
        if ((text.startsWith('"') && text.endsWith('"')) ||
            (text.startsWith("'") && text.endsWith("'"))) {
          value = text.substring(1, text.length - 1);
        }
        values.push({
          type: 'string',
          value: value
        });
      } else if (child.type === 'integer') {
        values.push({
          type: 'number',
          value: child.text,
          subtype: 'int'
        });
      } else if (child.type === 'float') {
        values.push({
          type: 'number', 
          value: child.text,
          subtype: 'float'
        });
      } else if (child.type === 'true') {
        values.push({
          type: 'boolean',
          value: true
        });
      } else if (child.type === 'false') {
        values.push({
          type: 'boolean',
          value: false
        });
      } else if (child.type === 'identifier') {
        values.push({
          type: 'variable',
          name: child.text
        });
      }
    }
    
    return values;
  }

  inferElementType(values) {
    if (values.length === 0) return 'String'; // Default to String for empty lists
    
    console.log('Inferring type from values:', values.map(v => v.type));
    
    const firstValue = values[0];
    
    // If all values are strings, return String
    if (values.every(v => v.type === 'string')) {
      console.log('All values are strings -> String[]');
      return 'String';
    }
    
    // If all values are numbers
    if (values.every(v => v.type === 'number')) {
      // Check if all are integers
      const allIntegers = values.every(v => v.subtype === 'int' || Number.isInteger(parseFloat(v.value)));
      console.log(`All numbers, all integers: ${allIntegers} -> ${allIntegers ? 'int[]' : 'float[]'}`);
      return allIntegers ? 'int' : 'float';
    }
    
    // If all values are booleans
    if (values.every(v => v.type === 'boolean')) {
      console.log('All values are booleans -> boolean[]');
      return 'boolean';
    }
    
    // Mixed types or unknown
    console.log('Mixed or unknown types -> Object[]');
    return 'Object';
  }
}