export class ArraysGenerator {
  canGenerate(astNode) {
    return astNode.type === 'array_declaration';
  }

  generate(astNode, context) {
    const indent = context.getIndent();
    
    console.log('=== DEBUG ArraysGenerator ===');
    console.log('Array AST:', astNode);
    
    const arrayName = astNode.name;
    const elementType = astNode.element_type;
    const values = astNode.values || [];
    
    // Check if it's a method call like .clone()
    if (values.length === 1 && values[0].type === 'method_call') {
      const methodCall = values[0];
      if (methodCall.method === 'clone' && methodCall.object) {
        const sourceArray = methodCall.object.name || 'source';
        return `${indent}${arrayName} = ${sourceArray}.copy()`;
      }
    }
    
    // Convert Java array to Python list
    if (values.length > 0) {
      // Array with initial values
      const pythonValues = values.map(value => {
        return this.generateValue(value, context);
      }).join(', ');
      
      return `${indent}${arrayName} = [${pythonValues}]`;
    } else {
      // Empty array
      return `${indent}${arrayName} = []`;
    }
  }

  generateValue(value, context) {
    if (value.type === 'literal') {
      if (typeof value.value === 'string') {
        return `"${value.value}"`;
      }
      return String(value.value);
    } else if (value.type === 'identifier') {
      return value.name;
    } else if (value.type === 'array') {
      // Handle nested arrays (multi-dimensional)
      const nestedValues = (value.values || []).map(nestedValue => {
        return this.generateValue(nestedValue, context);
      }).join(', ');
      return `[${nestedValues}]`;
    } else if (value.type === 'method_call') {
      // Handle method calls
      return this.generateMethodCall(value, context);
    }
    return String(value.value || 'None');
  }

  generateMethodCall(methodCall, context) {
    if (methodCall.method === 'clone' && methodCall.object) {
      const sourceArray = methodCall.object.name || 'source';
      return `${sourceArray}.copy()`;
    }
    return 'None';
  }
}