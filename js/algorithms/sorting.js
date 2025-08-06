// Sorting Algorithm Visualization

class SortingVisualization extends ArrayVisualization {
    constructor(canvas, ctx, steps) {
        super(canvas, ctx, steps);
        this.swapElements = new Set(); // Elements currently being swapped
        this.sortingPhase = 'comparing'; // 'comparing', 'swapping', 'sorted'
    }

    executeConditionOperation(step) {
        super.executeConditionOperation(step);
        this.sortingPhase = 'comparing';
    }

    executeAssignOperation(step) {
        // Detect swap operations in sorting
        if (this.isSwapOperation(step)) {
            this.handleSwapOperation(step);
        } else {
            super.executeAssignOperation(step);
        }
    }

    isSwapOperation(step) {
        // Simple heuristic: if we're assigning temp variables or array elements
        // in a pattern that suggests swapping
        return step.target === 'temp' || 
               (step.target.includes('[') && step.code.includes('temp'));
    }

    handleSwapOperation(step) {
        this.sortingPhase = 'swapping';
        
        // Extract array indices involved in the swap
        const arrayPattern = /(\w+)\[([^\]]+)\]/;
        const match = step.code.match(arrayPattern);
        
        if (match) {
            const arrayName = match[1];
            const array = this.arrays.get(arrayName);
            
            if (array) {
                // Highlight elements being swapped
                array.elements.forEach(element => {
                    if (this.compareHighlight.has(element.id)) {
                        this.swapElements.add(element.id);
                        this.highlightedElements.add(element.id);
                    }
                });
            }
        }
        
        super.executeAssignOperation(step);
    }

    render(stepIndex) {
        if (stepIndex !== this.currentStepIndex) {
            this.executeStep(stepIndex);
        }
        
        this.arrays.forEach(array => {
            this.renderSortingArray(array);
        });
        
        // Draw sorting phase indicator
        this.drawSortingPhase();
    }

    renderSortingArray(array) {
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
        this.ctx.fillText(array.name + ' (Sorting)', array.x - 10, array.y - containerHeight/2 - 10);
        
        // Draw elements with sorting-specific highlighting
        array.elements.forEach((element, index) => {
            const isComparing = this.compareHighlight.has(element.id);
            const isSwapping = this.swapElements.has(element.id);
            const isGeneral = this.highlightedElements.has(element.id);
            
            let fillColor = colors.node;
            let strokeColor = colors.edge;
            
            if (isSwapping) {
                fillColor = '#ef4444'; // Red for swapping
                strokeColor = '#dc2626';
            } else if (isComparing) {
                fillColor = '#f59e0b'; // Amber for comparing
                strokeColor = '#d97706';
            } else if (isGeneral) {
                fillColor = colors.highlight;
            }
            
            // Draw element box with slight animation effect for swaps
            let yOffset = 0;
            if (isSwapping) {
                yOffset = Math.sin(Date.now() / 200) * 5; // Subtle bounce for swapping
            }
            
            this.ctx.fillStyle = fillColor;
            this.ctx.fillRect(
                element.x - this.settings.nodeSize/2, 
                element.y - this.settings.nodeSize/2 + yOffset,
                this.settings.nodeSize, 
                this.settings.nodeSize
            );
            
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = isSwapping ? 3 : 2;
            this.ctx.strokeRect(
                element.x - this.settings.nodeSize/2, 
                element.y - this.settings.nodeSize/2 + yOffset,
                this.settings.nodeSize, 
                this.settings.nodeSize
            );
            
            // Draw element value
            this.ctx.fillStyle = colors.nodeText;
            this.ctx.font = `${Math.max(12, this.settings.nodeSize / 3)}px Inter, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(String(element.value), element.x, element.y + yOffset);
            
            // Draw index below
            this.ctx.fillStyle = colors.text;
            this.ctx.font = '10px Inter, sans-serif';
            this.ctx.fillText(String(index), element.x, element.y + this.settings.nodeSize/2 + 15);
        });
    }

    drawSortingPhase() {
        const colors = Utils.getCurrentColors();
        
        // Draw phase indicator
        this.ctx.fillStyle = colors.text;
        this.ctx.font = '16px Inter, sans-serif';
        this.ctx.textAlign = 'left';
        
        let phaseText = '';
        let phaseColor = colors.text;
        
        switch (this.sortingPhase) {
            case 'comparing':
                phaseText = '🔍 Comparing Elements';
                phaseColor = '#f59e0b';
                break;
            case 'swapping':
                phaseText = '🔄 Swapping Elements';
                phaseColor = '#ef4444';
                break;
            case 'sorted':
                phaseText = '✅ Sorted';
                phaseColor = '#10b981';
                break;
        }
        
        this.ctx.fillStyle = phaseColor;
        this.ctx.fillText(phaseText, 20, 30);
    }

    getStepExplanation(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            return '<p>No step selected.</p>';
        }
        
        const step = this.steps[stepIndex];
        let explanation = `<p><span class="highlight">${step.operation}</span>: ${step.description}</p>`;
        
        switch (step.operation) {
            case 'for':
                explanation += '<p>🔄 Starting a new iteration of the sorting loop.</p>';
                break;
            case 'if':
                explanation += '<p>🔍 Comparing elements to determine if they need to be swapped.</p>';
                if (this.compareHighlight.size > 0) {
                    explanation += '<p>📊 Elements highlighted in <span style="color: #f59e0b;">amber</span> are being compared.</p>';
                }
                break;
            case 'assign':
                if (this.isSwapOperation(step)) {
                    explanation += '<p>🔄 Swapping elements to move them to their correct positions.</p>';
                    explanation += '<p>📊 Elements highlighted in <span style="color: #ef4444;">red</span> are being swapped.</p>';
                } else {
                    explanation += '<p>💾 Storing a temporary value during the swap process.</p>';
                }
                break;
        }
        
        return explanation;
    }

    getDetails() {
        const arrayCount = this.arrays.size;
        let totalElements = 0;
        let comparingCount = this.compareHighlight.size;
        let swappingCount = this.swapElements.size;
        
        this.arrays.forEach(array => {
            totalElements += array.elements.length;
        });
        
        return `
            <p><strong>Algorithm:</strong> Bubble Sort</p>
            <p><strong>Array Elements:</strong> ${totalElements}</p>
            <p><strong>Current Phase:</strong> ${this.sortingPhase}</p>
            <p><strong>Comparing:</strong> ${comparingCount} elements</p>
            <p><strong>Swapping:</strong> ${swappingCount} elements</p>
            <p><strong>Step:</strong> ${this.currentStepIndex + 1} / ${this.steps.length}</p>
        `;
    }
}