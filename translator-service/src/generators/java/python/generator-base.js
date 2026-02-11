export class BaseGenerator {
  constructor() {
    this.typeMap = {
      'int': 'int',
      'float': 'double',
      'str': 'String',
      'bool': 'boolean',
      'list': 'ArrayList',
      'None': 'void',
      'Object': 'Object'
    };
  }

  canGenerate(astNode) {
    return false;
  }

  generate(astNode, context) {
    throw new Error('generate() must be implemented by subclass');
  }

  mapType(pythonType) {
    return this.typeMap[pythonType] || 'Object';
  }

  generateLiteral(value, dataType) {
    if (dataType === 'String') {
      return `"${value}"`;
    } else if (dataType === 'boolean') {
      return value ? 'true' : 'false';
    }
    return value;
  }

  generateExpression(expr, context) {
    if (!expr) return '';
    
    if (expr.type === 'literal') {
      return this.generateLiteral(expr.value, expr.data_type);
    } else if (expr.type === 'identifier') {
      return expr.name;
    } else if (expr.type === 'binary_operation') {
      const left = this.generateExpression(expr.left, context);
      const right = this.generateExpression(expr.right, context);
      const operator = this.mapOperator(expr.operator);
      return `${left} ${operator} ${right}`;
    }
    
    return expr.value || '';
  }

  mapOperator(op) {
    const operatorMap = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%',
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      'and': '&&',
      'or': '||'
    };
    return operatorMap[op] || op;
  }

  getIndent(context) {
    return '    '.repeat(context.indentLevel);
  }
}