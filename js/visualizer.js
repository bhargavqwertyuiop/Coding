// Main Visualization Engine

class Visualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.currentStructure = null;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.isPlaying = false;
        this.animationSpeed = 1;
        this.currentAnimation = null;
        this.settings = {
            nodeSize: 40,
            animationDuration: 800,
            colorScheme: 'default'
        };
        
        // Bind methods
        this.render = this.render.bind(this);
        this.animate = this.animate.bind(this);
        
        // Initialize
        this.loadSettings();
        this.setupCanvas();
    }

    // Load settings from localStorage
    loadSettings() {
        this.settings.nodeSize = parseInt(localStorage.getItem('nodeSize') || '40');
        this.settings.animationDuration = parseInt(localStorage.getItem('animationDuration') || '800');
        this.settings.colorScheme = localStorage.getItem('colorScheme') || 'default';
    }

    // Setup canvas and event listeners
    setupCanvas() {
        // Handle high DPI displays
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        // Add click event listener for interaction
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    // Initialize visualization with parsed code
    initialize(parsedResult) {
        if (!parsedResult.success) {
            this.showError(parsedResult.error);
            return false;
        }

        this.currentStructure = this.createStructureVisualization(parsedResult);
        this.totalSteps = parsedResult.steps.length;
        this.currentStep = 0;
        
        this.render();
        this.updateStepCounter();
        
        return true;
    }

    // Create appropriate structure visualization
    createStructureVisualization(parsedResult) {
        const { structureType, steps } = parsedResult;
        
        switch (structureType) {
            case 'linkedlist':
                return new LinkedListVisualization(this.canvas, this.ctx, steps);
            case 'array':
                return new ArrayVisualization(this.canvas, this.ctx, steps);
            case 'bst':
                return new BSTVisualization(this.canvas, this.ctx, steps);
            case 'graph':
                return new GraphVisualization(this.canvas, this.ctx, steps);
            case 'sorting':
                return new SortingVisualization(this.canvas, this.ctx, steps);
            default:
                return new LinkedListVisualization(this.canvas, this.ctx, steps);
        }
    }

    // Main render method
    render() {
        this.clear();
        
        if (this.currentStructure) {
            this.currentStructure.render(this.currentStep);
        }
        
        this.renderOverlay();
    }

    // Clear canvas
    clear() {
        const colors = Utils.getCurrentColors();
        this.ctx.fillStyle = colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Render overlay information
    renderOverlay() {
        const colors = Utils.getCurrentColors();
        this.ctx.fillStyle = colors.text;
        this.ctx.font = '14px Inter, sans-serif';
        
        // Render step information
        if (this.currentStructure && this.currentStructure.getCurrentStepInfo) {
            const stepInfo = this.currentStructure.getCurrentStepInfo(this.currentStep);
            if (stepInfo) {
                this.ctx.fillText(`Operation: ${stepInfo.operation}`, 10, 25);
                this.ctx.fillText(`Description: ${stepInfo.description}`, 10, 45);
            }
        }
    }

    // Animation control methods
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.animate();
        
        document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
    }

    pause() {
        this.isPlaying = false;
        if (this.currentAnimation) {
            cancelAnimationFrame(this.currentAnimation);
        }
        
        document.getElementById('playPauseBtn').innerHTML = '<i class="fas fa-play"></i>';
    }

    stop() {
        this.pause();
        this.currentStep = 0;
        this.render();
        this.updateStepCounter();
        this.updateExplanation();
    }

    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.executeStep(this.currentStep);
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.executeStep(this.currentStep);
        }
    }

    // Execute a specific step
    executeStep(stepIndex) {
        if (this.currentStructure && this.currentStructure.executeStep) {
            this.currentStructure.executeStep(stepIndex);
        }
        
        this.render();
        this.updateStepCounter();
        this.updateExplanation();
        this.highlightCodeLine(stepIndex);
    }

    // Animation loop
    animate() {
        if (!this.isPlaying) return;
        
        if (this.currentStep < this.totalSteps - 1) {
            this.nextStep();
            
            const delay = this.settings.animationDuration / this.animationSpeed;
            setTimeout(() => {
                this.currentAnimation = requestAnimationFrame(this.animate);
            }, delay);
        } else {
            this.pause();
        }
    }

    // Set animation speed
    setSpeed(speed) {
        this.animationSpeed = speed;
        document.getElementById('speedValue').textContent = speed + 'x';
    }

    // Update step counter display
    updateStepCounter() {
        const counter = document.getElementById('stepCounter');
        if (counter) {
            counter.textContent = `Step ${this.currentStep + 1} / ${this.totalSteps}`;
        }
        
        // Update control button states
        this.updateControlButtons();
    }

    // Update control button states
    updateControlButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) nextBtn.disabled = this.currentStep >= this.totalSteps - 1;
        if (playPauseBtn) playPauseBtn.disabled = this.totalSteps === 0;
        if (stopBtn) stopBtn.disabled = this.totalSteps === 0;
    }

    // Update explanation panel
    updateExplanation() {
        const explanationContent = document.getElementById('explanationContent');
        if (!explanationContent || !this.currentStructure) return;
        
        const explanation = this.currentStructure.getStepExplanation(this.currentStep);
        explanationContent.innerHTML = explanation || '<p>No explanation available for this step.</p>';
    }

    // Highlight corresponding code line
    highlightCodeLine(stepIndex) {
        if (!this.currentStructure || !this.currentStructure.steps) return;
        
        const step = this.currentStructure.steps[stepIndex];
        if (!step) return;
        
        const codeEditor = document.getElementById('codeEditor');
        const highlight = document.getElementById('codeLineHighlight');
        
        if (!codeEditor || !highlight) return;
        
        const lines = codeEditor.value.split('\n');
        const lineHeight = 21; // Approximate line height
        const topOffset = (step.lineNumber - 1) * lineHeight + 16; // 16px for padding
        
        highlight.style.top = topOffset + 'px';
        highlight.style.display = 'block';
        
        // Auto-scroll to highlighted line
        const scrollTop = Math.max(0, topOffset - codeEditor.offsetHeight / 2);
        codeEditor.scrollTop = scrollTop;
    }

    // Handle canvas click events
    handleCanvasClick(event) {
        if (!this.currentStructure || !this.currentStructure.handleClick) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.currentStructure.handleClick(x, y);
    }

    // Handle mouse move events
    handleMouseMove(event) {
        if (!this.currentStructure || !this.currentStructure.handleMouseMove) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.currentStructure.handleMouseMove(x, y);
    }

    // Show error message
    showError(message) {
        const explanationContent = document.getElementById('explanationContent');
        if (explanationContent) {
            explanationContent.innerHTML = `
                <div style="color: #e53e3e; padding: 1rem; background: #fed7d7; border-radius: 6px;">
                    <strong>Error:</strong> ${message}
                </div>
            `;
        }
    }

    // Resize canvas
    resize() {
        this.setupCanvas();
        this.render();
    }

    // Update settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Save to localStorage
        Object.keys(newSettings).forEach(key => {
            localStorage.setItem(key, newSettings[key]);
        });
        
        // Update current structure if exists
        if (this.currentStructure && this.currentStructure.updateSettings) {
            this.currentStructure.updateSettings(this.settings);
        }
        
        this.render();
    }

    // Get structure details for info panel
    getStructureDetails() {
        if (!this.currentStructure || !this.currentStructure.getDetails) {
            return 'No structure loaded';
        }
        
        return this.currentStructure.getDetails();
    }

    // Export current visualization as image
    exportAsImage() {
        const link = document.createElement('a');
        link.download = 'data-structure-visualization.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    // Reset visualization
    reset() {
        this.currentStructure = null;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.pause();
        this.clear();
        this.updateStepCounter();
        
        const explanationContent = document.getElementById('explanationContent');
        if (explanationContent) {
            explanationContent.innerHTML = '<p>Enter code above and click "Parse & Visualize" to begin the animation.</p>';
        }
        
        const highlight = document.getElementById('codeLineHighlight');
        if (highlight) {
            highlight.style.display = 'none';
        }
    }
}

// Base class for all structure visualizations
class BaseVisualization {
    constructor(canvas, ctx, steps) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.steps = steps;
        this.currentStepIndex = 0;
        this.nodes = [];
        this.edges = [];
        this.highlightedElements = new Set();
        this.settings = {
            nodeSize: parseInt(localStorage.getItem('nodeSize') || '40'),
            animationDuration: parseInt(localStorage.getItem('animationDuration') || '800'),
            colorScheme: localStorage.getItem('colorScheme') || 'default'
        };
    }

    // Abstract methods to be implemented by subclasses
    render(stepIndex) {
        throw new Error('render method must be implemented');
    }

    executeStep(stepIndex) {
        this.currentStepIndex = stepIndex;
        // Default implementation - subclasses can override
    }

    getStepExplanation(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            const step = this.steps[stepIndex];
            return `<p><span class="highlight">${step.operation}</span>: ${step.description}</p>`;
        }
        return '';
    }

    getCurrentStepInfo(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            return this.steps[stepIndex];
        }
        return null;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    // Common rendering utilities
    drawNode(x, y, value, highlighted = false) {
        const colors = Utils.getCurrentColors();
        const nodeSize = this.settings.nodeSize;
        
        // Node circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, nodeSize / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = highlighted ? colors.highlight : colors.node;
        this.ctx.fill();
        this.ctx.strokeStyle = colors.edge;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Node text
        this.ctx.fillStyle = colors.nodeText;
        this.ctx.font = `${Math.max(12, nodeSize / 3)}px Inter, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(String(value), x, y);
    }

    drawEdge(x1, y1, x2, y2, highlighted = false, directed = false) {
        const colors = Utils.getCurrentColors();
        const nodeSize = this.settings.nodeSize;
        
        // Calculate edge endpoints (don't draw inside nodes)
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const startX = x1 + Math.cos(angle) * (nodeSize / 2);
        const startY = y1 + Math.sin(angle) * (nodeSize / 2);
        const endX = x2 - Math.cos(angle) * (nodeSize / 2);
        const endY = y2 - Math.sin(angle) * (nodeSize / 2);
        
        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = highlighted ? colors.highlight : colors.edge;
        this.ctx.lineWidth = highlighted ? 3 : 2;
        this.ctx.stroke();
        
        // Draw arrow for directed edges
        if (directed) {
            const arrowLength = 10;
            const arrowAngle = Math.PI / 6;
            
            this.ctx.beginPath();
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - arrowLength * Math.cos(angle - arrowAngle),
                endY - arrowLength * Math.sin(angle - arrowAngle)
            );
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - arrowLength * Math.cos(angle + arrowAngle),
                endY - arrowLength * Math.sin(angle + arrowAngle)
            );
            this.ctx.stroke();
        }
    }

    drawText(x, y, text, highlighted = false) {
        const colors = Utils.getCurrentColors();
        
        this.ctx.fillStyle = highlighted ? colors.highlight : colors.text;
        this.ctx.font = '14px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
    }

    // Utility method to find node at position
    findNodeAt(x, y) {
        const nodeSize = this.settings.nodeSize;
        
        for (let node of this.nodes) {
            const distance = Utils.distance(x, y, node.x, node.y);
            if (distance <= nodeSize / 2) {
                return node;
            }
        }
        return null;
    }

    // Default click handler
    handleClick(x, y) {
        const node = this.findNodeAt(x, y);
        if (node) {
            console.log(`Clicked on node:`, node);
            // Show node details in info panel
            this.showNodeDetails(node);
        }
    }

    // Default mouse move handler
    handleMouseMove(x, y) {
        const node = this.findNodeAt(x, y);
        this.canvas.style.cursor = node ? 'pointer' : 'default';
    }

    // Show node details
    showNodeDetails(node) {
        const structureDetails = document.getElementById('structureDetails');
        if (structureDetails) {
            structureDetails.innerHTML = `
                <p><strong>Node Value:</strong> ${node.value}</p>
                <p><strong>Position:</strong> (${Math.round(node.x)}, ${Math.round(node.y)})</p>
                <p><strong>ID:</strong> ${node.id}</p>
            `;
        }
    }

    getDetails() {
        return `
            <p><strong>Total Steps:</strong> ${this.steps.length}</p>
            <p><strong>Current Step:</strong> ${this.currentStepIndex + 1}</p>
            <p><strong>Nodes:</strong> ${this.nodes.length}</p>
            <p><strong>Edges:</strong> ${this.edges.length}</p>
        `;
    }
}