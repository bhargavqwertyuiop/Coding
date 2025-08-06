// Array Visualization

class ArrayVisualization extends BaseVisualization {
    constructor(canvas, ctx, steps) {
        super(canvas, ctx, steps);
        this.arrays = new Map(); // variable name -> array structure
        this.currentVariables = new Map();
        this.accessHighlight = null; // Currently accessed element
        this.compareHighlight = new Set(); // Elements being compared
        this.executeAllSteps = false;
        
        this.initializeFromSteps();
    }

    // Initialize array structure from parsed steps
    initializeFromSteps() {
        this.executeAllSteps = true;
        for (let i = 0; i < this.steps.length; i++) {
            this.executeStep(i);
        }
        this.executeAllSteps = false;
        
        this.layoutArrays();
        this.currentStepIndex = 0;
        this.resetToStep(0);
    }

    // Execute a specific step
    executeStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        const step = this.steps[stepIndex];
        this.currentStepIndex = stepIndex;
        
        // Clear highlights
        this.highlightedElements.clear();
        this.accessHighlight = null;
        this.compareHighlight.clear();
        
        switch (step.operation) {
            case 'declare':
            case 'create':
                this.executeCreateOperation(step);
                break;
            case 'assign':
                this.executeAssignOperation(step);
                break;
            case 'call':
                this.executeMethodCall(step);
                break;
            case 'for':
            case 'while':
                this.executeLoopOperation(step);
                break;
            case 'if':
                this.executeConditionOperation(step);
                break;
        }
        
        this.updateArrayPositions();
    }

    // Execute create operation
    executeCreateOperation(step) {
        if (step.value.startsWith('[') && step.value.endsWith(']')) {
            // Array literal: [1, 2, 3]
            const elements = this.parseArrayLiteral(step.value);
            const array = {
                id: Utils.generateId(),
                name: step.target,
                elements: elements.map((value, index) => ({
                    id: Utils.generateId(),
                    value: value,
                    index: index,
                    x: 0,
                    y: 0,
                    highlighted: false,
                    visible: true
                })),
                x: 0,
                y: 0
            };
            
            this.arrays.set(step.target, array);
            this.currentVariables.set(step.target, array);
            this.nodes = array.elements; // For base class compatibility
            
        } else if (step.value.includes('new Array')) {
            // new Array() constructor
            const array = {
                id: Utils.generateId(),
                name: step.target,
                elements: [],
                x: 0,
                y: 0
            };
            
            this.arrays.set(step.target, array);
            this.currentVariables.set(step.target, array);
        }
    }

    // Execute assignment operation
    executeAssignOperation(step) {
        // Handle array element assignment: arr[index] = value
        if (step.target.includes('[') && step.target.includes(']')) {
            const match = step.target.match(/(\w+)\[(.+)\]/);
            if (match) {
                const arrayName = match[1];
                const indexExpr = match[2];
                const array = this.arrays.get(arrayName);
                
                if (array) {
                    const index = this.evaluateExpression(indexExpr);
                    if (index >= 0 && index < array.elements.length) {
                        array.elements[index].value = step.value;
                        this.highlightedElements.add(array.elements[index].id);
                    }
                }
            }
        } else {
            // Regular variable assignment
            if (step.value.includes('[')) {
                this.executeCreateOperation({ ...step, operation: 'create' });
            } else {
                // Variable access: let element = arr[i]
                const sourceArray = this.findArrayReference(step.value);
                if (sourceArray) {
                    const element = sourceArray.element;
                    this.accessHighlight = element.id;
                    this.highlightedElements.add(element.id);
                }
                this.currentVariables.set(step.target, step.value);
            }
        }
    }

    // Execute method call (push, pop, etc.)
    executeMethodCall(step) {
        const array = this.arrays.get(step.target);
        if (!array) return;
        
        switch (step.method) {
            case 'push':
                if (step.parameters.length > 0) {
                    const newElement = {
                        id: Utils.generateId(),
                        value: step.parameters[0],
                        index: array.elements.length,
                        x: 0,
                        y: 0,
                        highlighted: true,
                        visible: true
                    };
                    array.elements.push(newElement);
                    this.highlightedElements.add(newElement.id);
                }
                break;
                
            case 'pop':
                if (array.elements.length > 0) {
                    const removed = array.elements.pop();
                    this.highlightedElements.add(removed.id);
                }
                break;
                
            case 'unshift':
                if (step.parameters.length > 0) {
                    const newElement = {
                        id: Utils.generateId(),
                        value: step.parameters[0],
                        index: 0,
                        x: 0,
                        y: 0,
                        highlighted: true,
                        visible: true
                    };
                    // Shift all existing elements
                    array.elements.forEach(el => el.index++);
                    array.elements.unshift(newElement);
                    this.highlightedElements.add(newElement.id);
                }
                break;
                
            case 'shift':
                if (array.elements.length > 0) {
                    const removed = array.elements.shift();
                    // Update indices
                    array.elements.forEach((el, idx) => el.index = idx);
                    this.highlightedElements.add(removed.id);
                }
                break;
        }
        
        this.nodes = array.elements; // Update nodes for base class
    }

    // Execute loop operation (for sorting algorithms)
    executeLoopOperation(step) {
        // Highlight loop variables if they're array indices
        const condition = step.condition;
        if (condition) {
            const matches = condition.match(/(\w+)\s*[<>=]/g);
            if (matches) {
                matches.forEach(match => {
                    const varName = match.match(/(\w+)/)[1];
                    // Try to find corresponding array element
                    this.arrays.forEach(array => {
                        const index = this.evaluateExpression(varName);
                        if (index >= 0 && index < array.elements.length) {
                            this.highlightedElements.add(array.elements[index].id);
                        }
                    });
                });
            }
        }
    }

    // Execute condition operation (for comparisons in sorting)
    executeConditionOperation(step) {
        const condition = step.condition;
        
        // Look for array element comparisons: arr[i] > arr[j]
        const arrayAccessPattern = /(\w+)\[([^\]]+)\]/g;
        const matches = [...condition.matchAll(arrayAccessPattern)];
        
        matches.forEach(match => {
            const arrayName = match[1];
            const indexExpr = match[2];
            const array = this.arrays.get(arrayName);
            
            if (array) {
                const index = this.evaluateExpression(indexExpr);
                if (index >= 0 && index < array.elements.length) {
                    this.compareHighlight.add(array.elements[index].id);
                    this.highlightedElements.add(array.elements[index].id);
                }
            }
        });
    }

    // Parse array literal [1, 2, 3] into values
    parseArrayLiteral(literal) {
        const content = literal.slice(1, -1).trim(); // Remove [ and ]
        if (!content) return [];
        
        return content.split(',').map(item => item.trim().replace(/['"]/g, ''));
    }

    // Find array element reference in expression
    findArrayReference(expression) {
        const match = expression.match(/(\w+)\[(.+)\]/);
        if (match) {
            const arrayName = match[1];
            const indexExpr = match[2];
            const array = this.arrays.get(arrayName);
            
            if (array) {
                const index = this.evaluateExpression(indexExpr);
                if (index >= 0 && index < array.elements.length) {
                    return {
                        array: array,
                        element: array.elements[index],
                        index: index
                    };
                }
            }
        }
        return null;
    }

    // Evaluate simple expressions (for demo purposes)
    evaluateExpression(expr) {
        // Simple integer parsing for demo
        const num = parseInt(expr.trim());
        return isNaN(num) ? 0 : num;
    }

    // Layout arrays
    layoutArrays() {
        let yOffset = 100;
        
        this.arrays.forEach(array => {
            array.x = 100;
            array.y = yOffset;
            
            // Position array elements
            array.elements.forEach((element, index) => {
                element.x = array.x + index * (this.settings.nodeSize + 10);
                element.y = array.y;
                element.index = index;
            });
            
            yOffset += 100;
        });
    }

    // Update array positions after modifications
    updateArrayPositions() {
        this.arrays.forEach(array => {
            array.elements.forEach((element, index) => {
                element.x = array.x + index * (this.settings.nodeSize + 10);
                element.index = index;
            });
        });
    }

    // Reset to specific step
    resetToStep(stepIndex) {
        // Reset and re-execute up to target step
        const originalArrays = new Map();
        this.arrays.forEach((array, name) => {
            originalArrays.set(name, JSON.parse(JSON.stringify(array)));
        });
        
        this.currentVariables.clear();
        this.arrays.clear();
        
        for (let i = 0; i <= stepIndex; i++) {
            this.executeStep(i);
        }
    }

    // Main render method
    render(stepIndex) {
        if (stepIndex !== this.currentStepIndex) {
            this.executeStep(stepIndex);
        }
        
        this.arrays.forEach(array => {
            this.renderArray(array);
        });
    }

    // Render a single array
    renderArray(array) {
        const colors = Utils.getCurrentColors();
        
        // Draw array container
        const containerWidth = array.elements.length * (this.settings.nodeSize + 10);
        const containerHeight = this.settings.nodeSize + 20;
        
        this.ctx.strokeStyle = colors.edge;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(array.x - 10, array.y - containerHeight/2, containerWidth, containerHeight);
        
        // Draw array name
        this.ctx.fillStyle = colors.text;
        this.ctx.font = '14px Inter, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(array.name, array.x - 10, array.y - containerHeight/2 - 10);
        
        // Draw elements
        array.elements.forEach((element, index) => {
            const highlighted = this.highlightedElements.has(element.id) ||
                             this.accessHighlight === element.id ||
                             this.compareHighlight.has(element.id);
            
            // Different highlight colors for different operations
            let highlightColor = colors.highlight;
            if (this.accessHighlight === element.id) {
                highlightColor = '#fbbf24'; // Yellow for access
            } else if (this.compareHighlight.has(element.id)) {
                highlightColor = '#f87171'; // Red for comparison
            }
            
            // Draw element box
            this.ctx.fillStyle = highlighted ? highlightColor : colors.node;
            this.ctx.fillRect(
                element.x - this.settings.nodeSize/2, 
                element.y - this.settings.nodeSize/2,
                this.settings.nodeSize, 
                this.settings.nodeSize
            );
            
            this.ctx.strokeStyle = colors.edge;
            this.ctx.strokeRect(
                element.x - this.settings.nodeSize/2, 
                element.y - this.settings.nodeSize/2,
                this.settings.nodeSize, 
                this.settings.nodeSize
            );
            
            // Draw element value
            this.ctx.fillStyle = colors.nodeText;
            this.ctx.font = `${Math.max(12, this.settings.nodeSize / 3)}px Inter, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(String(element.value), element.x, element.y);
            
            // Draw index below
            this.ctx.fillStyle = colors.text;
            this.ctx.font = '10px Inter, sans-serif';
            this.ctx.fillText(String(index), element.x, element.y + this.settings.nodeSize/2 + 15);
        });
    }

    // Get step explanation
    getStepExplanation(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            return '<p>No step selected.</p>';
        }
        
        const step = this.steps[stepIndex];
        let explanation = `<p><span class="highlight">${step.operation}</span>: ${step.description}</p>`;
        
        switch (step.operation) {
            case 'create':
                explanation += '<p>Creating a new array with the specified elements.</p>';
                break;
            case 'call':
                switch (step.method) {
                    case 'push':
                        explanation += '<p>Adding an element to the end of the array.</p>';
                        break;
                    case 'pop':
                        explanation += '<p>Removing the last element from the array.</p>';
                        break;
                    case 'unshift':
                        explanation += '<p>Adding an element to the beginning of the array.</p>';
                        break;
                    case 'shift':
                        explanation += '<p>Removing the first element from the array.</p>';
                        break;
                }
                break;
            case 'assign':
                if (step.target.includes('[')) {
                    explanation += '<p>Setting the value of a specific array element.</p>';
                } else {
                    explanation += '<p>Accessing an array element and storing it in a variable.</p>';
                }
                break;
            case 'if':
                explanation += '<p>Comparing array elements for sorting or searching.</p>';
                break;
            case 'for':
                explanation += '<p>Iterating through the array elements.</p>';
                break;
        }
        
        return explanation;
    }

    // Handle click events
    handleClick(x, y) {
        let clickedElement = null;
        
        this.arrays.forEach(array => {
            array.elements.forEach(element => {
                const distance = Utils.distance(x, y, element.x, element.y);
                if (distance <= this.settings.nodeSize / 2) {
                    clickedElement = element;
                }
            });
        });
        
        if (clickedElement) {
            this.showElementDetails(clickedElement);
            this.highlightedElements.clear();
            this.highlightedElements.add(clickedElement.id);
        }
    }

    // Show element details
    showElementDetails(element) {
        const structureDetails = document.getElementById('structureDetails');
        if (structureDetails) {
            structureDetails.innerHTML = `
                <p><strong>Element Value:</strong> ${element.value}</p>
                <p><strong>Array Index:</strong> ${element.index}</p>
                <p><strong>Element ID:</strong> ${element.id}</p>
                <p><strong>Position:</strong> (${Math.round(element.x)}, ${Math.round(element.y)})</p>
            `;
        }
    }

    // Get structure details
    getDetails() {
        const arrayCount = this.arrays.size;
        let totalElements = 0;
        this.arrays.forEach(array => {
            totalElements += array.elements.length;
        });
        
        return `
            <p><strong>Structure Type:</strong> Array</p>
            <p><strong>Array Count:</strong> ${arrayCount}</p>
            <p><strong>Total Elements:</strong> ${totalElements}</p>
            <p><strong>Current Step:</strong> ${this.currentStepIndex + 1} / ${this.steps.length}</p>
        `;
    }
}