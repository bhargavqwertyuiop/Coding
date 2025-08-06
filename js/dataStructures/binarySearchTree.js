// Binary Search Tree Visualization

class BSTVisualization extends BaseVisualization {
    constructor(canvas, ctx, steps) {
        super(canvas, ctx, steps);
        this.trees = new Map();
        this.currentVariables = new Map();
        this.executeAllSteps = false;
        
        this.initializeFromSteps();
    }

    initializeFromSteps() {
        this.executeAllSteps = true;
        for (let i = 0; i < this.steps.length; i++) {
            this.executeStep(i);
        }
        this.executeAllSteps = false;
        
        this.layoutTree();
        this.currentStepIndex = 0;
        this.resetToStep(0);
    }

    executeStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        const step = this.steps[stepIndex];
        this.currentStepIndex = stepIndex;
        this.highlightedElements.clear();
        
        switch (step.operation) {
            case 'declare':
            case 'create':
                this.executeCreateOperation(step);
                break;
            case 'assign':
                this.executeAssignOperation(step);
                break;
        }
    }

    executeCreateOperation(step) {
        if (step.value.includes('new TreeNode')) {
            const match = step.value.match(/new\s+TreeNode\s*\(\s*(.+?)\s*\)/);
            const nodeValue = match ? match[1] : '?';
            
            const node = {
                id: Utils.generateId(),
                value: nodeValue,
                left: null,
                right: null,
                x: 0,
                y: 0,
                visible: true,
                highlighted: false
            };
            
            this.currentVariables.set(step.target, node);
            this.nodes.push(node);
        }
    }

    executeAssignOperation(step) {
        const parts = step.target.split('.');
        
        if (parts.length === 2) {
            const objectName = parts[0];
            const property = parts[1];
            const object = this.currentVariables.get(objectName);
            
            if (object && typeof object === 'object') {
                if (property === 'left' || property === 'right') {
                    const targetNode = this.currentVariables.get(step.value);
                    if (targetNode && typeof targetNode === 'object') {
                        object[property] = targetNode;
                        this.updateEdges();
                    }
                    
                    this.highlightedElements.add(object.id);
                    if (object[property]) {
                        this.highlightedElements.add(object[property].id);
                    }
                }
            }
        } else {
            // Simple assignment
            if (step.value.includes('new TreeNode')) {
                this.executeCreateOperation({ ...step, operation: 'create' });
            } else {
                const sourceNode = this.currentVariables.get(step.value);
                if (sourceNode) {
                    this.currentVariables.set(step.target, sourceNode);
                }
            }
        }
    }

    updateEdges() {
        this.edges = [];
        
        this.nodes.forEach(node => {
            if (node.left) {
                this.edges.push({
                    id: `${node.id}-${node.left.id}`,
                    from: node.id,
                    to: node.left.id,
                    fromNode: node,
                    toNode: node.left
                });
            }
            if (node.right) {
                this.edges.push({
                    id: `${node.id}-${node.right.id}`,
                    from: node.id,
                    to: node.right.id,
                    fromNode: node,
                    toNode: node.right
                });
            }
        });
    }

    layoutTree() {
        if (this.nodes.length === 0) return;
        
        const root = this.findRootNode();
        if (root) {
            const positions = Utils.calculateLayout.tree([root], this.canvas, root.id);
            this.assignPositions(positions);
        }
        
        this.updateEdges();
    }

    findRootNode() {
        const rootVar = this.currentVariables.get('root');
        if (rootVar && typeof rootVar === 'object') {
            return rootVar;
        }
        
        return this.nodes.length > 0 ? this.nodes[0] : null;
    }

    assignPositions(positions) {
        positions.forEach(pos => {
            const node = this.nodes.find(n => n.id === pos.id);
            if (node) {
                node.x = pos.x;
                node.y = pos.y;
            }
        });
    }

    resetToStep(stepIndex) {
        this.currentVariables.clear();
        this.nodes.forEach(node => {
            node.highlighted = false;
            node.visible = false;
        });
        
        for (let i = 0; i <= stepIndex; i++) {
            this.executeStep(i);
        }
    }

    render(stepIndex) {
        if (stepIndex !== this.currentStepIndex) {
            this.executeStep(stepIndex);
        }
        
        // Draw edges
        this.edges.forEach(edge => {
            if (edge.fromNode.visible && edge.toNode.visible) {
                const highlighted = this.highlightedElements.has(edge.fromNode.id) || 
                                 this.highlightedElements.has(edge.toNode.id);
                this.drawEdge(
                    edge.fromNode.x, edge.fromNode.y,
                    edge.toNode.x, edge.toNode.y,
                    highlighted, false
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
    }

    getStepExplanation(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            return '<p>No step selected.</p>';
        }
        
        const step = this.steps[stepIndex];
        let explanation = `<p><span class="highlight">${step.operation}</span>: ${step.description}</p>`;
        
        switch (step.operation) {
            case 'create':
                explanation += '<p>Creating a new tree node with the specified value.</p>';
                break;
            case 'assign':
                if (step.target.includes('.left') || step.target.includes('.right')) {
                    explanation += '<p>Connecting nodes to form the tree structure.</p>';
                }
                break;
        }
        
        return explanation;
    }

    getDetails() {
        return `
            <p><strong>Structure Type:</strong> Binary Search Tree</p>
            <p><strong>Total Nodes:</strong> ${this.nodes.length}</p>
            <p><strong>Current Step:</strong> ${this.currentStepIndex + 1} / ${this.steps.length}</p>
        `;
    }
}