export class ASTNode {
  constructor(type, properties = {}) {
    this.type = type;
    Object.assign(this, properties);
  }
}

export class VariableDeclaration extends ASTNode {
  constructor(name, dataType, value) {
    super('variable_declaration', {
      name,
      data_type: dataType,
      value
    });
  }
}

export class PrintStatement extends ASTNode {
  constructor(args) {
    super('print_statement', { args });
  }
}

export class Comment extends ASTNode {
  constructor(text) {
    super('comment', { text });
  }
}

export class ConditionalStatement extends ASTNode {
  constructor(condition, thenBranch, elseBranch = null, elifBranches = []) {
    super('conditional_statement', {
      condition,
      then_branch: thenBranch,
      else_branch: elseBranch,
      elif_branches: elifBranches  // Now this variable exists!
    });
  }
}

// Add this to your existing ASTNode classes
export class LoopStatement extends ASTNode {
  constructor(type, variable, iterable, body, condition = null) {
    super('loop_statement', {
      loop_type: type,          // 'for' or 'while'
      variable: variable,       // loop variable (for 'for' loops)
      iterable: iterable,       // what to iterate over (for 'for' loops)
      condition: condition,     // condition (for 'while' loops)
      body: body               // loop body statements
    });
  }
}

export class ArrayDeclaration extends ASTNode {
  constructor(name, elementType, values) {
    super('array_declaration', {
      name,
      element_type: elementType,
      values
    });
  }
}
// Add to existing classes...

export class BinaryExpression extends ASTNode {
  constructor(left, operator, right) {
    super('binary_expression', {
      left,
      operator,
      right
    });
  }
}

export class UnaryExpression extends ASTNode {
  constructor(operator, operand) {
    super('unary_expression', {
      operator,
      operand
    });
  }
}

export class LogicalExpression extends ASTNode {
  constructor(left, operator, right) {
    super('logical_expression', {
      left,
      operator,
      right
    });
  }
}

export class ComparisonExpression extends ASTNode {
  constructor(left, operator, right) {
    super('comparison_expression', {
      left,
      operator,
      right
    });
  }
}

// Add these to your existing ast-nodes.js

export class FunctionDeclaration extends ASTNode {
  constructor(name, returnType, parameters = [], body = []) {
    super('function_declaration', {
      name,
      return_type: returnType,
      parameters,
      body
    });
  }
}

export class CallExpression extends ASTNode {
  constructor(functionName, args = []) {
    super('call_expression', {
      function_name: functionName,
      arguments: args
    });
  }
}

export class ReturnStatement extends ASTNode {
  constructor(value) {
    super('return_statement', { value });
  }
}

export class IncludeStatement extends ASTNode {
  constructor(header) {
    super('include_statement', { header });
  }
}