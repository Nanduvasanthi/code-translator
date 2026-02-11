export class JavaToCVisitor {
  constructor(context) {
    this.context = context;
    this.indentLevel = 0;
  }

  visit(node) {
    if (!node) return null;

    console.log(`Visiting node: ${node.type}`);

    switch (node.type) {
      case 'program':
        return this.visitProgram(node);
      case 'class_declaration':
        return this.visitClassDeclaration(node);
      case 'method_declaration':
        return this.visitMethodDeclaration(node);
      case 'block':
        return this.visitBlock(node);
      case 'local_variable_declaration':
        return this.visitLocalVariableDeclaration(node);
      case 'expression_statement':
        return this.visitExpressionStatement(node);
      case 'if_statement':
        return this.visitIfStatement(node);
      case 'for_statement':
        return this.visitForStatement(node);
      case 'while_statement':
        return this.visitWhileStatement(node);
      case 'do_statement':
        return this.visitDoStatement(node);
      case 'enhanced_for_statement':
        return this.visitEnhancedForStatement(node);
      case 'method_invocation':
        return this.visitMethodInvocation(node);
      case 'binary_expression':
        return this.visitBinaryExpression(node);
      case 'assignment_expression':
        return this.visitAssignmentExpression(node);
      case 'update_expression':
        return this.visitUpdateExpression(node);
      case 'identifier':
        return this.visitIdentifier(node);
      case 'literal':
        return this.visitLiteral(node);
      case 'string_literal':
        return this.visitStringLiteral(node);
      case 'character_literal':
        return this.visitCharacterLiteral(node);
      case 'line_comment':
      case 'block_comment':
        return this.visitComment(node);
      case 'array_creation_expression':
        return this.visitArrayCreation(node);
      case 'array_access_expression':
        return this.visitArrayAccess(node);
      default:
        console.log(`Unhandled node type in visitor: ${node.type}`);
        this.context.addWarning(`Unhandled node type: ${node.type}`);
        return null;
    }
  }

  visitProgram(node) {
    return {
      type: 'program',
      includes: ['stdio.h'],
      functions: [],
      globalVars: []
    };
  }

  visitClassDeclaration(node) {
    const className = this.getClassName(node);
    this.context.setCurrentClass(className);

    return {
      type: 'class',
      name: className,
      methods: [],
      fields: []
    };
  }

  visitMethodDeclaration(node) {
    const methodName = this.getMethodName(node);
    const returnType = this.getReturnType(node);
    const isMain = methodName === 'main' && 
                   this.hasModifier(node, 'public') && 
                   this.hasModifier(node, 'static');

    this.context.setCurrentFunction(methodName);

    const result = {
      type: 'function',
      name: isMain ? 'main' : methodName,
      returnType: this.context.mapJavaTypeToC(returnType),
      parameters: this.getMethodParameters(node),
      body: null,
      isMain: isMain
    };

    const block = this.findChildByType(node, 'block');
    if (block) {
      result.body = this.visit(block);
    }

    return result;
  }

  visitBlock(node) {
    const statements = [];

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === '{' || child.type === '}' || child.type === 'empty_statement') {
        continue;
      }
      
      const childResult = this.visit(child);
      if (childResult) {
        statements.push(childResult);
      }
    }

    return {
      type: 'block',
      statements: statements
    };
  }

  visitLocalVariableDeclaration(node) {
    const typeNode = this.findChildByType(node, 'integral_type') || 
                     this.findChildByType(node, 'floating_point_type') ||
                     this.findChildByType(node, 'type_identifier') ||
                     this.findChildByType(node, 'boolean_type');
    
    const variableName = this.findChildByType(node, 'identifier');
    const initializer = this.findChildByType(node, 'variable_initializer');

    if (!typeNode || !variableName) {
      console.log('Missing type or variable name in variable declaration');
      return null;
    }

    const javaType = typeNode.text;
    const varName = variableName.text;
    const cType = this.context.mapJavaTypeToC(javaType);

    this.context.addSymbol(varName, cType);

    const result = {
      type: 'variable_declaration',
      varType: cType,
      varName: varName,
      initialValue: null
    };

    if (initializer) {
      result.initialValue = this.visit(initializer);
    }

    return result;
  }

  visitExpressionStatement(node) {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'method_invocation' || 
          child.type === 'assignment_expression' ||
          child.type === 'update_expression') {
        return this.visit(child);
      }
    }
    return null;
  }

  visitMethodInvocation(node) {
    const methodName = this.getMethodInvocationName(node);
    
    // Handle System.out.println
    if (methodName.includes('println') || methodName.includes('print')) {
      const argumentsList = this.getMethodArguments(node);
      return {
        type: 'print_statement',
        arguments: argumentsList.map(arg => this.visit(arg))
      };
    }

    // Handle other method calls
    const argumentsList = this.getMethodArguments(node);
    return {
      type: 'call_expression',
      function_name: methodName,
      arguments: argumentsList.map(arg => this.visit(arg))
    };
  }

  visitIfStatement(node) {
    const condition = this.findChildByType(node, 'parenthesized_expression');
    const thenBlock = this.findChildByType(node, 'block');
    const elseClause = this.findChildByType(node, 'else');

    const result = {
      type: 'if_statement',
      condition: condition ? this.visit(condition) : null,
      thenBlock: thenBlock ? this.visit(thenBlock) : null,
      elseBlock: null
    };

    if (elseClause) {
      const elseBlock = this.findChildByType(elseClause, 'block');
      if (elseBlock) {
        result.elseBlock = this.visit(elseBlock);
      } else {
        // Handle else if
        const elseIf = this.findChildByType(elseClause, 'if_statement');
        if (elseIf) {
          result.elseBlock = this.visit(elseIf);
        }
      }
    }

    return result;
  }

  visitForStatement(node) {
    const init = this.findChildByType(node, 'local_variable_declaration') || 
                 this.findChildByType(node, 'expression_statement');
    const condition = this.findChildByType(node, 'binary_expression') ||
                     this.findChildByType(node, 'parenthesized_expression');
    const update = this.findChildByType(node, 'update_expression') ||
                   this.findChildByType(node, 'expression_statement');
    const body = this.findChildByType(node, 'block');

    return {
      type: 'for_loop',
      initialization: init ? this.visit(init) : null,
      condition: condition ? this.visit(condition) : null,
      update: update ? this.visit(update) : null,
      body: body ? this.visit(body) : null
    };
  }

  visitWhileStatement(node) {
    const condition = this.findChildByType(node, 'parenthesized_expression');
    const body = this.findChildByType(node, 'block');

    return {
      type: 'while_loop',
      condition: condition ? this.visit(condition) : null,
      body: body ? this.visit(body) : null
    };
  }

  visitDoStatement(node) {
    const body = this.findChildByType(node, 'block');
    const condition = this.findChildByType(node, 'parenthesized_expression');

    return {
      type: 'do_while_loop',
      condition: condition ? this.visit(condition) : null,
      body: body ? this.visit(body) : null
    };
  }

  visitEnhancedForStatement(node) {
    const variable = this.findChildByType(node, 'local_variable_declaration');
    const iterable = this.findChildByType(node, 'identifier');
    const body = this.findChildByType(node, 'block');

    return {
      type: 'enhanced_for_loop',
      variable: variable ? this.visit(variable) : null,
      iterable: iterable ? this.visit(iterable) : null,
      body: body ? this.visit(body) : null
    };
  }

  visitBinaryExpression(node) {
    const left = node.child(0);
    const operator = node.child(1);
    const right = node.child(2);

    if (!left || !operator || !right) return null;

    return {
      type: 'binary_expression',
      left: this.visit(left),
      operator: operator.text,
      right: this.visit(right)
    };
  }

  visitAssignmentExpression(node) {
    const left = node.child(0);
    const operator = node.child(1);
    const right = node.child(2);

    if (!left || !operator || !right) return null;

    return {
      type: 'assignment_expression',
      left: this.visit(left),
      operator: operator.text,
      right: this.visit(right)
    };
  }

  visitUpdateExpression(node) {
    const operator = node.child(0);
    const operand = node.child(1);

    if (!operator || !operand) return null;

    const isPostfix = operator.type === 'identifier' || operator.type === 'field_access';

    return {
      type: 'update_expression',
      operator: isPostfix ? operand.text : operator.text,
      operand: isPostfix ? this.visit(operator) : this.visit(operand),
      is_postfix: isPostfix
    };
  }

  visitIdentifier(node) {
    return {
      type: 'identifier',
      name: node.text
    };
  }

  visitLiteral(node) {
    const value = node.text;
    
    // Determine literal type
    let literalType = 'integer';
    if (value === 'true' || value === 'false') {
      literalType = 'boolean';
    } else if (value.includes('.')) {
      literalType = 'float';
    } else if (value.endsWith('f') || value.endsWith('F')) {
      literalType = 'float';
    } else if (value.endsWith('l') || value.endsWith('L')) {
      literalType = 'long';
    }

    return {
      type: 'literal',
      value: value,
      literalType: literalType
    };
  }

  visitStringLiteral(node) {
    return {
      type: 'literal',
      value: node.text,
      literalType: 'string'
    };
  }

  visitCharacterLiteral(node) {
    return {
      type: 'literal',
      value: node.text,
      literalType: 'character'
    };
  }

  visitComment(node) {
    return {
      type: 'comment',
      text: node.text,
      isBlock: node.type === 'block_comment'
    };
  }

  visitArrayCreation(node) {
    const typeNode = this.findChildByType(node, 'type_identifier');
    const sizeNode = this.findChildByType(node, 'dimensions_expr');

    return {
      type: 'array_declaration',
      element_type: typeNode ? typeNode.text : 'int',
      size: sizeNode ? this.visit(sizeNode) : null
    };
  }

  visitArrayAccess(node) {
    const arrayNode = node.child(0);
    const indexNode = node.child(2); // After '[' and before ']'

    return {
      type: 'array_access',
      array: arrayNode ? this.visit(arrayNode) : null,
      index: indexNode ? this.visit(indexNode) : null
    };
  }

  // Helper methods
  getClassName(node) {
    const identifier = this.findChildByType(node, 'identifier');
    return identifier ? identifier.text : 'UnknownClass';
  }

  getMethodName(node) {
    const identifier = this.findChildByType(node, 'identifier');
    return identifier ? identifier.text : 'unknownMethod';
  }

  getMethodInvocationName(node) {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'identifier') {
        return child.text;
      }
    }
    return '';
  }

  getReturnType(node) {
    const typeNode = this.findChildByType(node, 'integral_type') ||
                     this.findChildByType(node, 'floating_point_type') ||
                     this.findChildByType(node, 'type_identifier') ||
                     this.findChildByType(node, 'void_type');
    return typeNode ? typeNode.text : 'void';
  }

  getMethodParameters(node) {
    const parameters = [];
    const formalParameters = this.findChildByType(node, 'formal_parameters');
    
    if (formalParameters) {
      for (let i = 0; i < formalParameters.childCount; i++) {
        const param = formalParameters.child(i);
        if (param.type === 'formal_parameter') {
          const typeNode = this.findChildByType(param, 'integral_type') ||
                           this.findChildByType(param, 'floating_point_type') ||
                           this.findChildByType(param, 'type_identifier');
          const identifier = this.findChildByType(param, 'identifier');
          
          if (typeNode && identifier) {
            parameters.push({
              type: this.context.mapJavaTypeToC(typeNode.text),
              name: identifier.text
            });
          }
        }
      }
    }

    return parameters;
  }

  getMethodArguments(node) {
    const argumentsList = [];
    const argumentList = this.findChildByType(node, 'argument_list');
    
    if (argumentList) {
      for (let i = 0; i < argumentList.childCount; i++) {
        argumentsList.push(argumentList.child(i));
      }
    }
    
    return argumentsList;
  }

  hasModifier(node, modifier) {
    const modifiers = this.findChildByType(node, 'modifiers');
    if (modifiers) {
      for (let i = 0; i < modifiers.childCount; i++) {
        const child = modifiers.child(i);
        if (child.text === modifier) {
          return true;
        }
      }
    }
    return false;
  }

  findChildByType(node, type) {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === type) {
        return child;
      }
    }
    return null;
  }
}