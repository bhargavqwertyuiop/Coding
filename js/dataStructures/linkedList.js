// Linked List Visualization

class LinkedListVisualization extends BaseVisualization {
    constructor(canvas, ctx, steps) {
        super(canvas, ctx, steps);
        this.linkedList = new Map(); // variable name -> node structure
        this.nodePositions = new Map(); // node id -> position
        this.currentVariables = new Map(); // track current variable values
        this.executeAllSteps = false;
        
        this.initializeFromSteps();
    }

    // Initialize the linked list structure from parsed steps
    initializeFromSteps() {
        // Execute all steps to build final structure, then reset for animation
        this.executeAllSteps = true;
        for (let i = 0; i < this.steps.length; i++) {
            this.executeStep(i);
        }
        this.executeAllSteps = false;
        
        // Layout nodes
        this.layoutNodes();
        
        // Reset to initial state
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
        
        switch (step.operation) {
            case 'declare':
            case 'create':
                this.executeCreateOperation(step);
                break;
            case 'assign':
                this.executeAssignOperation(step);
                break;
            case 'insert':
                this.executeInsertOperation(step);
                break;
            case 'remove':
                this.executeRemoveOperation(step);
                break;
            case 'search':
                this.executeSearchOperation(step);
                break;
        }
        
        if (!this.executeAllSteps) {
            this.updateNodeVisibility();
        }
    }

    // Execute create operation (new node)
    executeCreateOperation(step) {
        if (step.operationType === 'node' && step.value.includes('new ListNode')) {
            // Extract value from "new ListNode(value)"
            const match = step.value.match(/new\s+ListNode\s*\(\s*(.+?)\s*\)/);
            const nodeValue = match ? match[1] : '?';
            
            const node = {
                id: Utils.generateId(),
                value: nodeValue,
                next: null,
                x: 0,
                y: 0,
                visible: true,
                highlighted: false
            };
            
            this.currentVariables.set(step.target, node);
            this.nodes.push(node);
            
        } else if (step.operationType === 'variable') {
            // Regular variable assignment
            this.currentVariables.set(step.target, step.value);
        }
    }

    // Execute assignment operation
    executeAssignOperation(step) {
        const parts = step.target.split('.');
        
        if (parts.length === 1) {
            // Simple assignment: variable = value
            const targetVar = parts[0];
            
            if (step.value.includes('new ListNode')) {
                this.executeCreateOperation({ ...step, operation: 'create', operationType: 'node' });
            } else {
                // Assignment to existing variable
                const sourceNode = this.currentVariables.get(step.value);
                if (sourceNode) {
                    this.currentVariables.set(targetVar, sourceNode);
                } else {
                    this.currentVariables.set(targetVar, step.value);
                }
            }
            
        } else if (parts.length === 2) {
            // Property assignment: object.property = value
            const objectName = parts[0];
            const property = parts[1];
            const object = this.currentVariables.get(objectName);
            
            if (object && typeof object === 'object') {
                if (property === 'next') {
                    const targetNode = this.currentVariables.get(step.value);
                    if (targetNode && typeof targetNode === 'object') {
                        object.next = targetNode;
                        this.updateEdges();
                    } else if (step.value === 'null') {
                        object.next = null;
                        this.updateEdges();
                    }
                    
                    // Highlight the connection
                    this.highlightedElements.add(object.id);
                    if (object.next) {
                        this.highlightedElements.add(object.next.id);
                    }
                }
            }
        }
    }

    // Execute insert operation
    executeInsertOperation(step) {
        // This would be for method calls like list.insert()
        // For now, most insertions are handled through assignments
        this.highlightedElements.add(step.target);
    }

    // Execute remove operation
    executeRemoveOperation(step) {
        // Handle node removal
        this.highlightedElements.add(step.target);
    }

    // Execute search operation
    executeSearchOperation(step) {
        // Highlight search path
        this.highlightedElements.add(step.target);
    }

    // Update edges based on next pointers
    updateEdges() {
        this.edges = [];
        
        this.nodes.forEach(node => {
            if (node.next && typeof node.next === 'object') {
                this.edges.push({
                    id: `${node.id}-${node.next.id}`,
                    from: node.id,
                    to: node.next.id,
                    fromNode: node,
                    toNode: node.next
                });
            }
        });
    }

    // Layout nodes in a horizontal line
    layoutNodes() {
        if (this.nodes.length === 0) return;
        
        const positions = Utils.calculateLayout.linear(this.nodes, this.canvas, 'horizontal');
        
        positions.forEach((pos, index) => {
            if (index < this.nodes.length) {
                this.nodes[index].x = pos.x;
                this.nodes[index].y = pos.y;
                this.nodePositions.set(this.nodes[index].id, pos);
            }
        });
        
        this.updateEdges();
    }

    // Update node visibility based on current step
    updateNodeVisibility() {
        // For linked lists, we typically show all created nodes
        // but can hide nodes that haven't been created yet
        this.nodes.forEach(node => {
            node.visible = true;
        });
    }

    // Reset to a specific step
    resetToStep(stepIndex) {
        // Reset all variables and re-execute steps up to the target
        this.currentVariables.clear();
        this.nodes.forEach(node => {
            node.highlighted = false;
            node.visible = false;
        });
        
        for (let i = 0; i <= stepIndex; i++) {
            this.executeStep(i);
        }
    }

    // Main render method
    render(stepIndex) {
        if (stepIndex !== this.currentStepIndex) {
            this.executeStep(stepIndex);
        }
        
        // Draw edges first (behind nodes)
        this.edges.forEach(edge => {
            if (edge.fromNode.visible && edge.toNode.visible) {
                const highlighted = this.highlightedElements.has(edge.fromNode.id) || 
                                 this.highlightedElements.has(edge.toNode.id);
                this.drawEdge(
                    edge.fromNode.x, edge.fromNode.y,
                    edge.toNode.x, edge.toNode.y,
                    highlighted, true
                );
            }
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            if (node.visible) {
                const highlighted = this.highlightedElements.has(node.id);
                this.drawNode(node.x, node.y, node.value, highlighted);
            }
        });
        
        // Draw variable labels
        this.drawVariableLabels();
        
        // Draw null pointers
        this.drawNullPointers();
    }

    // Draw variable labels
    drawVariableLabels() {
        const colors = Utils.getCurrentColors();
        this.ctx.font = '12px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = colors.text;
        
        let labelY = 50;
        this.currentVariables.forEach((value, varName) => {
            if (typeof value === 'object' && value.id) {
                // Draw arrow from variable name to node
                const node = value;
                this.ctx.fillText(varName, 50, labelY);
                
                // Draw arrow
                this.ctx.strokeStyle = colors.edge;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(70, labelY - 3);
                this.ctx.lineTo(node.x - 30, node.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                
                labelY += 25;
            }
        });
    }

    // Draw null pointers
    drawNullPointers() {
        const colors = Utils.getCurrentColors();
        
        this.nodes.forEach(node => {
            if (node.visible && !node.next) {
                const x = node.x + this.settings.nodeSize / 2 + 10;
                const y = node.y;
                
                // Draw "null" text
                this.ctx.font = '12px Inter, sans-serif';
                this.ctx.textAlign = 'left';
                this.ctx.fillStyle = colors.text;
                this.ctx.fillText('null', x, y + 4);
                
                // Draw X symbol
                this.ctx.strokeStyle = colors.edge;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x + 30, y - 5);
                this.ctx.lineTo(x + 40, y + 5);
                this.ctx.moveTo(x + 40, y - 5);
                this.ctx.lineTo(x + 30, y + 5);
                this.ctx.stroke();
            }
        });
    }

    // Get step explanation
    getStepExplanation(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            return '<p>No step selected.</p>';
        }
        
        const step = this.steps[stepIndex];
        let explanation = `<p><span class="highlight">${step.operation}</span>: ${step.description}</p>`;
        
        // Add detailed explanation based on operation
        switch (step.operation) {
            case 'create':
                explanation += '<p>Creating a new node in memory with the specified value.</p>';
                break;
            case 'assign':
                if (step.target.includes('.next')) {
                    explanation += '<p>Linking this node to another node by setting the next pointer.</p>';
                } else {
                    explanation += '<p>Assigning a reference to the variable.</p>';
                }
                break;
            case 'declare':
                explanation += '<p>Declaring a new variable to store a reference.</p>';
                break;
        }
        
        return explanation;
    }

    // Handle click events
    handleClick(x, y) {
        const node = this.findNodeAt(x, y);
        if (node) {
            this.showNodeDetails(node);
            
            // Highlight the clicked node and its connections
            this.highlightedElements.clear();
            this.highlightedElements.add(node.id);
            
            // Also highlight the next node if it exists
            if (node.next) {
                this.highlightedElements.add(node.next.id);
            }
        }
    }

    // Show detailed node information
    showNodeDetails(node) {
        const structureDetails = document.getElementById('structureDetails');
        if (structureDetails) {
            let nextInfo = 'null';
            if (node.next) {
                nextInfo = `Node(${node.next.value})`;
            }
            
            structureDetails.innerHTML = `
                <p><strong>Node Value:</strong> ${node.value}</p>
                <p><strong>Next Pointer:</strong> ${nextInfo}</p>
                <p><strong>Memory Address:</strong> ${node.id}</p>
                <p><strong>Position:</strong> (${Math.round(node.x)}, ${Math.round(node.y)})</p>
            `;
        }
    }

    // Get structure details
    getDetails() {
        const listLength = this.calculateListLength();
        const headNode = this.findHeadNode();
        
        return `
            <p><strong>Structure Type:</strong> Linked List</p>
            <p><strong>Total Nodes:</strong> ${this.nodes.length}</p>
            <p><strong>List Length:</strong> ${listLength}</p>
            <p><strong>Head Node:</strong> ${headNode ? headNode.value : 'None'}</p>
            <p><strong>Current Step:</strong> ${this.currentStepIndex + 1} / ${this.steps.length}</p>
        `;
    }

    // Calculate the length of the main list
    calculateListLength() {
        const headNode = this.findHeadNode();
        if (!headNode) return 0;
        
        let length = 0;
        let current = headNode;
        const visited = new Set();
        
        while (current && !visited.has(current.id)) {
            visited.add(current.id);
            length++;
            current = current.next;
        }
        
        return length;
    }

    // Find the head node (referenced by a variable named 'head' or first in list)
    findHeadNode() {
        // Try to find a variable named 'head'
        const headVar = this.currentVariables.get('head');
        if (headVar && typeof headVar === 'object') {
            return headVar;
        }
        
        // Otherwise, find a node that is not pointed to by any other node
        const pointedTo = new Set();
        this.nodes.forEach(node => {
            if (node.next) {
                pointedTo.add(node.next.id);
            }
        });
        
        const headCandidate = this.nodes.find(node => !pointedTo.has(node.id));
        return headCandidate || (this.nodes.length > 0 ? this.nodes[0] : null);
    }

    // Animate to a specific step
    animateToStep(targetStep) {
        if (targetStep === this.currentStepIndex) return;
        
        const isForward = targetStep > this.currentStepIndex;
        
        if (isForward) {
            // Animate forward
            const step = this.steps[targetStep];
            if (step.operation === 'create') {
                // Animate node appearance
                const newNode = this.nodes[this.nodes.length - 1];
                if (newNode) {
                    animationEngine.animateNodeAppear(newNode);
                }
            } else if (step.operation === 'assign' && step.target.includes('.next')) {
                // Animate edge connection
                this.updateEdges();
                const newEdge = this.edges[this.edges.length - 1];
                if (newEdge) {
                    animationEngine.animateEdgeDraw(newEdge);
                }
            }
        } else {
            // Animate backward - typically just jump to the step
            this.resetToStep(targetStep);
        }
        
        this.executeStep(targetStep);
    }
}