export const Utils = {
  indent(code, level) {
    const indentStr = '    '.repeat(level);
    return code.split('\n').map(line => indentStr + line).join('\n');
  },
  
  escapeString(str) {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
};