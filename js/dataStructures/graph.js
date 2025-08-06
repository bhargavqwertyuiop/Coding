// Graph Visualization

class GraphVisualization extends BaseVisualization {
    constructor(canvas, ctx, steps) {
        super(canvas, ctx, steps);
        this.graphs = new Map();
        this.vertices = [];
        this.graphEdges = [];
        this.executeAllSteps = false;
        
        this.initializeFromSteps();
    }

    initializeFromSteps() {
        this.executeAllSteps = true;
        for (let i = 0; i < this.steps.length; i++) {
            this.executeStep(i);
        }
        this.executeAllSteps = false;
        
        this.layoutGraph();
        this.currentStepIndex = 0;
        this.resetToStep(0);
    }

    executeStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        const step = this.steps[stepIndex];
        this.currentStepIndex = stepIndex;
        this.highlightedElements.clear();
        
        // Basic graph operations parsing
        if (step.description.includes('vertices') || step.description.includes('edges')) {
            this.parseGraphOperation(step);
        }
    }

    parseGraphOperation(step) {
        // Simple parsing for demo - in a real implementation this would be more robust
        if (step.code.includes('vertices')) {
            this.vertices = ['A', 'B', 'C', 'D'];
            this.nodes = this.vertices.map((vertex, index) => ({
                id: vertex,
                value: vertex,
                x: 0,
                y: 0,
                visible: true,
                highlighted: false
            }));
        }
        
        if (step.code.includes('edges.push')) {
            // Extract edge from code like graph.edges.push(['A', 'B'])
            const match = step.code.match(/\[['"](\w+)['"],\s*['"](\w+)['"]\]/);
            if (match) {
                this.graphEdges.push({
                    from: match[1],
                    to: match[2],
                    id: `${match[1]}-${match[2]}`
                });
            }
        }
    }

    layoutGraph() {
        if (this.nodes.length === 0) return;
        
        const positions = Utils.calculateLayout.grid(this.nodes, this.canvas);
        positions.forEach((pos, index) => {
            if (index < this.nodes.length) {
                this.nodes[index].x = pos.x;
                this.nodes[index].y = pos.y;
            }
        });
        
        this.updateEdges();
    }

    updateEdges() {
        this.edges = this.graphEdges.map(edge => {
            const fromNode = this.nodes.find(n => n.id === edge.from);
            const toNode = this.nodes.find(n => n.id === edge.to);
            
            return {
                id: edge.id,
                from: edge.from,
                to: edge.to,
                fromNode: fromNode,
                toNode: toNode
            };
        });
    }

    resetToStep(stepIndex) {
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
            if (edge.fromNode && edge.toNode) {
                this.drawEdge(
                    edge.fromNode.x, edge.fromNode.y,
                    edge.toNode.x, edge.toNode.y,
                    false, false
                );
            }
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            if (node.visible) {
                this.drawNode(node.x, node.y, node.value, false);
            }
        });
    }

    getStepExplanation(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            return '<p>No step selected.</p>';
        }
        
        const step = this.steps[stepIndex];
        return `<p><span class="highlight">${step.operation}</span>: ${step.description}</p>
                <p>Building graph structure with vertices and edges.</p>`;
    }

    getDetails() {
        return `
            <p><strong>Structure Type:</strong> Graph</p>
            <p><strong>Vertices:</strong> ${this.nodes.length}</p>
            <p><strong>Edges:</strong> ${this.edges.length}</p>
            <p><strong>Current Step:</strong> ${this.currentStepIndex + 1} / ${this.steps.length}</p>
        `;
    }
}