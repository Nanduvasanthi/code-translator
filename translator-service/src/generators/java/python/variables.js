import { TypeMapper } from '../../../core/type-mapper.js';

export class VariablesGenerator {
  canGenerate(astNode) {
    return astNode.type === 'variable_declaration';
  }

  generate(astNode, context) {
    const javaType = TypeMapper.mapPythonToJava(astNode.data_type);
    const indent = context.getIndent();
    
    let valueStr = '';
    if (astNode.value) {
      if (astNode.value.type === 'literal') {
        if (astNode.data_type === 'str') {
          valueStr = ` = "${astNode.value.value}"`;
        } else if (astNode.data_type === 'bool') {
          valueStr = ` = ${astNode.value.value ? 'true' : 'false'}`;
        } else {
          valueStr = ` = ${astNode.value.value}`;
        }
      } else if (astNode.value.type === 'identifier') {
        valueStr = ` = ${astNode.value.name}`;
      } else if (astNode.value.type === 'ternary_expression') {
        // Generate ternary expression
        const ternaryGenerator = context.getGenerator('ternary');
        if (ternaryGenerator && ternaryGenerator.canGenerate(astNode.value)) {
          const ternaryValue = ternaryGenerator.generate(astNode.value, context);
          valueStr = ` = ${ternaryValue}`;
        } else {
          // Fallback if no generator found
          valueStr = ' = null';
        }
      }
    }
    
    return `${indent}${javaType} ${astNode.name}${valueStr};`;
  }
  
}