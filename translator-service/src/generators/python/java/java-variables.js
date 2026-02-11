export class VariablesGenerator {
  canGenerate(astNode) {
    return astNode.type === 'variable_declaration';
  }

  generate(astNode, context) {
    // REMOVED: const pythonType = context.mapJavaToPython(astNode.data_type);
    const indent = context.getIndent();
    
    let valueStr = '';
    
    // Check if value exists
    if (astNode.value) {
      // Handle different value types
      if (astNode.value.type === 'literal') {
        valueStr = this.generateLiteralValue(astNode.value, astNode.data_type, context);
      } else if (astNode.value.type === 'identifier') {
        valueStr = ` = ${astNode.value.name}`;
      } else if (astNode.value.type === 'ternary_expression') {
        valueStr = this.generateTernaryValue(astNode.value, context);
      } else {
        // Default fallback
        valueStr = ` = ${JSON.stringify(astNode.value)}`;
      }
    } else {
      // No value provided
      valueStr = ' = None';
    }
    
    // OLD: return `${indent}${astNode.name}${valueStr}  # ${pythonType}`;
    // NEW: Without type comment
    return `${indent}${astNode.name}${valueStr}`;
  }

  generateLiteralValue(value, javaType, context) {
    const val = value.value;
    
    switch (javaType) {
      case 'String':
      case 'char':
        return ` = "${val}"`;
        
      case 'boolean':
        return ` = ${val ? 'True' : 'False'}`;
        
      case 'float':
      case 'double':
        let floatVal = val;
        // Ensure float has decimal point
        if (!floatVal.toString().includes('.')) {
          floatVal += '.0';
        }
        return ` = ${floatVal}`;
        
      case 'long':
        // Remove L suffix if present
        let longVal = val;
        if (typeof longVal === 'string' && longVal.endsWith('L')) {
          longVal = longVal.slice(0, -1);
          context.addWarning(`Long literal ${longVal}L converted to int`);
        }
        return ` = ${longVal}`;
        
      default:
        return ` = ${val}`;
    }
  }

  generateTernaryValue(value, context) {
    const ternaryGenerator = context.getGenerator('ternary');
    if (ternaryGenerator && ternaryGenerator.canGenerate(value)) {
      const ternaryValue = ternaryGenerator.generate(value, context);
      return ` = ${ternaryValue}`;
    }
    return ' = None';
  }
}