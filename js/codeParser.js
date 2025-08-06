// Code Parser for Data Structure Visualizer

class CodeParser {
    constructor() {
        this.currentStructureType = 'linkedlist';
        this.parsedSteps = [];
        this.variables = new Map();
        this.functions = new Map();
        this.classes = new Map();
    }

    // Main parsing method
    parse(code, structureType = 'linkedlist') {
        this.currentStructureType = structureType;
        this.parsedSteps = [];
        this.variables.clear();
        this.functions.clear();
        this.classes.clear();

        try {
            const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            // First pass: identify classes and functions
            this.identifyStructures(lines);
            
            // Second pass: parse execution steps
            this.parseExecutionSteps(lines);
            
            return {
                success: true,
                steps: this.parsedSteps,
                structureType: this.currentStructureType,
                variables: Array.from(this.variables.entries()),
                functions: Array.from(this.functions.entries()),
                classes: Array.from(this.classes.entries())
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                steps: [],
                structureType: this.currentStructureType
            };
        }
    }

    // Identify classes and functions in the code
    identifyStructures(lines) {
        let currentClass = null;
        let currentFunction = null;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // Class definition
            if (line.includes('class ')) {
                const className = this.extractClassName(line);
                if (className) {
                    currentClass = {
                        name: className,
                        methods: [],
                        properties: [],
                        startLine: lineNumber
                    };
                    this.classes.set(className, currentClass);
                }
            }

            // Function definition
            if (line.includes('function ') || line.match(/\w+\s*\(/)) {
                const functionName = this.extractFunctionName(line);
                if (functionName) {
                    currentFunction = {
                        name: functionName,
                        parameters: this.extractParameters(line),
                        startLine: lineNumber,
                        class: currentClass?.name
                    };
                    this.functions.set(functionName, currentFunction);
                    
                    if (currentClass) {
                        currentClass.methods.push(functionName);
                    }
                }
            }

            // Count braces for scope tracking
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;

            if (braceCount === 0) {
                currentClass = null;
                currentFunction = null;
            }
        }
    }

    // Parse execution steps
    parseExecutionSteps(lines) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // Skip class and function definitions
            if (line.includes('class ') || line.includes('function ') || 
                line.includes('constructor(') || line.startsWith('//')) {
                continue;
            }

            const step = this.parseLine(line, lineNumber);
            if (step) {
                this.parsedSteps.push(step);
            }
        }
    }

    // Parse individual line
    parseLine(line, lineNumber) {
        const trimmedLine = line.trim();
        
        // Variable declaration
        if (trimmedLine.match(/^(let|const|var)\s+/)) {
            return this.parseVariableDeclaration(trimmedLine, lineNumber);
        }

        // Assignment
        if (trimmedLine.includes('=') && !trimmedLine.includes('==') && !trimmedLine.includes('===')) {
            return this.parseAssignment(trimmedLine, lineNumber);
        }

        // Method call
        if (trimmedLine.includes('.') && trimmedLine.includes('(')) {
            return this.parseMethodCall(trimmedLine, lineNumber);
        }

        // Function call
        if (trimmedLine.match(/\w+\s*\(/)) {
            return this.parseFunctionCall(trimmedLine, lineNumber);
        }

        // Return statement
        if (trimmedLine.startsWith('return ')) {
            return this.parseReturn(trimmedLine, lineNumber);
        }

        // Control structures
        if (trimmedLine.match(/^(if|while|for)\s*\(/)) {
            return this.parseControlStructure(trimmedLine, lineNumber);
        }

        return null;
    }

    // Parse variable declaration
    parseVariableDeclaration(line, lineNumber) {
        const match = line.match(/^(let|const|var)\s+(\w+)\s*=\s*(.+);?$/);
        if (!match) return null;

        const [, keyword, varName, value] = match;
        
        // Determine the type of value being assigned
        let operation = 'declare';
        let operationType = 'variable';
        
        if (value.includes('new ')) {
            operation = 'create';
            if (value.includes('ListNode') || value.includes('Node')) {
                operationType = 'node';
            } else if (value.includes('Array') || value.startsWith('[')) {
                operationType = 'array';
            } else if (value.includes('Tree') || value.includes('BST')) {
                operationType = 'tree';
            }
        } else if (value.startsWith('[')) {
            operation = 'create';
            operationType = 'array';
        }

        this.variables.set(varName, {
            type: operationType,
            value: value,
            lineNumber: lineNumber
        });

        return {
            lineNumber,
            operation,
            operationType,
            target: varName,
            value: value,
            code: line,
            description: `Declare variable '${varName}' with value: ${value}`
        };
    }

    // Parse assignment
    parseAssignment(line, lineNumber) {
        const match = line.match(/^(\w+(?:\.\w+)*)\s*=\s*(.+);?$/);
        if (!match) return null;

        const [, target, value] = match;
        
        return {
            lineNumber,
            operation: 'assign',
            operationType: 'assignment',
            target: target,
            value: value,
            code: line,
            description: `Assign ${value} to ${target}`
        };
    }

    // Parse method call
    parseMethodCall(line, lineNumber) {
        const match = line.match(/^(\w+)\.(\w+)\s*\(([^)]*)\);?$/);
        if (!match) return null;

        const [, object, method, params] = match;
        
        let operation = 'call';
        let operationType = 'method';
        
        // Specific operations for data structures
        if (method === 'push' || method === 'insert' || method === 'add') {
            operation = 'insert';
            operationType = this.getStructureType(object);
        } else if (method === 'pop' || method === 'remove' || method === 'delete') {
            operation = 'remove';
            operationType = this.getStructureType(object);
        } else if (method === 'find' || method === 'search' || method === 'get') {
            operation = 'search';
            operationType = this.getStructureType(object);
        }

        return {
            lineNumber,
            operation,
            operationType,
            target: object,
            method: method,
            parameters: params.split(',').map(p => p.trim()).filter(p => p),
            code: line,
            description: `Call ${method} on ${object}${params ? ' with parameters: ' + params : ''}`
        };
    }

    // Parse function call
    parseFunctionCall(line, lineNumber) {
        const match = line.match(/^(\w+)\s*\(([^)]*)\);?$/);
        if (!match) return null;

        const [, functionName, params] = match;
        
        return {
            lineNumber,
            operation: 'call',
            operationType: 'function',
            target: functionName,
            parameters: params.split(',').map(p => p.trim()).filter(p => p),
            code: line,
            description: `Call function ${functionName}${params ? ' with parameters: ' + params : ''}`
        };
    }

    // Parse return statement
    parseReturn(line, lineNumber) {
        const match = line.match(/^return\s+(.+);?$/);
        const value = match ? match[1] : '';
        
        return {
            lineNumber,
            operation: 'return',
            operationType: 'control',
            value: value,
            code: line,
            description: `Return ${value || 'void'}`
        };
    }

    // Parse control structures
    parseControlStructure(line, lineNumber) {
        const match = line.match(/^(if|while|for)\s*\(([^)]+)\)/);
        if (!match) return null;

        const [, keyword, condition] = match;
        
        return {
            lineNumber,
            operation: keyword,
            operationType: 'control',
            condition: condition,
            code: line,
            description: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} statement with condition: ${condition}`
        };
    }

    // Helper methods
    extractClassName(line) {
        const match = line.match(/class\s+(\w+)/);
        return match ? match[1] : null;
    }

    extractFunctionName(line) {
        // Function declaration
        let match = line.match(/function\s+(\w+)/);
        if (match) return match[1];

        // Method definition
        match = line.match(/(\w+)\s*\(/);
        if (match) return match[1];

        // Arrow function
        match = line.match(/(\w+)\s*=\s*\(/);
        if (match) return match[1];

        return null;
    }

    extractParameters(line) {
        const match = line.match(/\(([^)]*)\)/);
        if (!match) return [];
        
        return match[1].split(',').map(p => p.trim()).filter(p => p);
    }

    getStructureType(objectName) {
        const variable = this.variables.get(objectName);
        if (variable) {
            return variable.type;
        }
        
        // Infer from name patterns
        if (objectName.toLowerCase().includes('list') || objectName.toLowerCase().includes('node')) {
            return 'linkedlist';
        } else if (objectName.toLowerCase().includes('tree') || objectName.toLowerCase().includes('bst')) {
            return 'tree';
        } else if (objectName.toLowerCase().includes('array') || objectName.toLowerCase().includes('arr')) {
            return 'array';
        } else if (objectName.toLowerCase().includes('graph')) {
            return 'graph';
        }
        
        return this.currentStructureType;
    }

    // Generate example code for different data structures
    static generateExample(structureType) {
        const examples = {
            linkedlist: `// Linked List Example
class ListNode {
    constructor(val) {
        this.val = val;
        this.next = null;
    }
}

let head = new ListNode(1);
head.next = new ListNode(2);
head.next.next = new ListNode(3);

// Insert at beginning
let newNode = new ListNode(0);
newNode.next = head;
head = newNode;

// Insert at end
let current = head;
while (current.next) {
    current = current.next;
}
current.next = new ListNode(4);`,

            array: `// Array Operations
let arr = [3, 1, 4, 1, 5];

// Insert element
arr.push(9);
arr.unshift(2);

// Access elements
let element = arr[2];

// Remove elements
arr.pop();
arr.shift();

// Sort array
for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
            let temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
        }
    }
}`,

            bst: `// Binary Search Tree
class TreeNode {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
    }
}

let root = new TreeNode(5);
root.left = new TreeNode(3);
root.right = new TreeNode(8);
root.left.left = new TreeNode(1);
root.left.right = new TreeNode(4);

// Insert new node
function insert(root, val) {
    if (!root) return new TreeNode(val);
    
    if (val < root.val) {
        root.left = insert(root.left, val);
    } else {
        root.right = insert(root.right, val);
    }
    return root;
}

root = insert(root, 7);
root = insert(root, 9);`,

            graph: `// Graph Operations
let graph = {
    vertices: ['A', 'B', 'C', 'D'],
    edges: []
};

// Add edges
graph.edges.push(['A', 'B']);
graph.edges.push(['B', 'C']);
graph.edges.push(['C', 'D']);
graph.edges.push(['A', 'D']);

// BFS traversal
function bfs(graph, start) {
    let visited = new Set();
    let queue = [start];
    
    while (queue.length > 0) {
        let vertex = queue.shift();
        if (!visited.has(vertex)) {
            visited.add(vertex);
            // Add neighbors to queue
        }
    }
}`,

            sorting: `// Bubble Sort Algorithm
let arr = [64, 34, 25, 12, 22, 11, 90];

for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
        // Compare adjacent elements
        if (arr[j] > arr[j + 1]) {
            // Swap elements
            let temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
        }
    }
}`
        };

        return examples[structureType] || examples.linkedlist;
    }

    // Validate code syntax (basic validation)
    static validateCode(code) {
        const errors = [];
        const lines = code.split('\n');

        let braceCount = 0;
        let parenCount = 0;
        let bracketCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // Count brackets
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            parenCount += (line.match(/\(/g) || []).length;
            parenCount -= (line.match(/\)/g) || []).length;
            bracketCount += (line.match(/\[/g) || []).length;
            bracketCount -= (line.match(/\]/g) || []).length;

            // Check for common syntax errors
            if (line.length > 0 && !line.endsWith(';') && !line.endsWith('{') && 
                !line.endsWith('}') && !line.startsWith('//') && !line.includes('class ') &&
                !line.includes('function ') && !line.includes('if ') && !line.includes('for ') &&
                !line.includes('while ') && !line.includes('else')) {
                errors.push(`Line ${lineNumber}: Missing semicolon`);
            }
        }

        if (braceCount !== 0) {
            errors.push('Mismatched braces');
        }
        if (parenCount !== 0) {
            errors.push('Mismatched parentheses');
        }
        if (bracketCount !== 0) {
            errors.push('Mismatched brackets');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}