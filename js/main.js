// Main Application Controller

class DataStructureVisualizer {
    constructor() {
        this.visualizer = null;
        this.codeParser = new CodeParser();
        this.currentCode = '';
        this.currentStructureType = 'linkedlist';
        
        this.initializeApp();
    }

    initializeApp() {
        // Initialize visualizer
        this.visualizer = new Visualizer('visualizationCanvas');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial example
        this.loadExample('linkedlist');
        
        // Setup window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    setupEventListeners() {
        // Code input and parsing
        document.getElementById('parseBtn').addEventListener('click', this.parseAndVisualize.bind(this));
        document.getElementById('resetBtn').addEventListener('click', this.resetVisualization.bind(this));
        
        // Data structure type selection
        document.getElementById('dataStructureType').addEventListener('change', this.handleStructureTypeChange.bind(this));
        
        // Playback controls
        document.getElementById('playPauseBtn').addEventListener('click', this.togglePlayPause.bind(this));
        document.getElementById('prevBtn').addEventListener('click', this.previousStep.bind(this));
        document.getElementById('nextBtn').addEventListener('click', this.nextStep.bind(this));
        document.getElementById('stopBtn').addEventListener('click', this.stopAnimation.bind(this));
        
        // Speed control
        document.getElementById('speedSlider').addEventListener('input', this.handleSpeedChange.bind(this));
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', this.openSettings.bind(this));
        document.getElementById('closeSettingsBtn').addEventListener('click', this.closeSettings.bind(this));
        
        // Settings controls
        this.setupSettingsControls();
        
        // Code editor auto-resize
        document.getElementById('codeEditor').addEventListener('input', this.handleCodeChange.bind(this));
    }

    setupSettingsControls() {
        // Node size control
        const nodeSizeSlider = document.getElementById('nodeSize');
        const nodeSizeValue = document.getElementById('nodeSizeValue');
        
        nodeSizeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            nodeSizeValue.textContent = value + 'px';
            this.visualizer.updateSettings({ nodeSize: parseInt(value) });
        });
        
        // Animation duration control
        const animationSlider = document.getElementById('animationDuration');
        const animationValue = document.getElementById('animationDurationValue');
        
        animationSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            animationValue.textContent = value + 'ms';
            this.visualizer.updateSettings({ animationDuration: parseInt(value) });
        });
        
        // Color scheme control
        document.getElementById('colorScheme').addEventListener('change', (e) => {
            this.visualizer.updateSettings({ colorScheme: e.target.value });
            this.visualizer.render();
        });
        
        // Load current settings
        this.loadCurrentSettings();
    }

    loadCurrentSettings() {
        const nodeSize = localStorage.getItem('nodeSize') || '40';
        const animationDuration = localStorage.getItem('animationDuration') || '800';
        const colorScheme = localStorage.getItem('colorScheme') || 'default';
        
        document.getElementById('nodeSize').value = nodeSize;
        document.getElementById('nodeSizeValue').textContent = nodeSize + 'px';
        document.getElementById('animationDuration').value = animationDuration;
        document.getElementById('animationDurationValue').textContent = animationDuration + 'ms';
        document.getElementById('colorScheme').value = colorScheme;
    }

    handleStructureTypeChange(event) {
        const newType = event.target.value;
        this.currentStructureType = newType;
        this.loadExample(newType);
    }

    loadExample(structureType) {
        const exampleCode = CodeParser.generateExample(structureType);
        document.getElementById('codeEditor').value = exampleCode;
        this.currentCode = exampleCode;
        
        // Auto-parse if there's existing visualization
        if (this.visualizer.currentStructure) {
            this.parseAndVisualize();
        }
    }

    handleCodeChange(event) {
        this.currentCode = event.target.value;
        
        // Debounced auto-parsing (optional)
        clearTimeout(this.autoParseTimeout);
        this.autoParseTimeout = setTimeout(() => {
            // Auto-parse can be enabled here if desired
        }, 2000);
    }

    parseAndVisualize() {
        const code = document.getElementById('codeEditor').value;
        const structureType = document.getElementById('dataStructureType').value;
        
        if (!code.trim()) {
            this.showMessage('Please enter some code to visualize.', 'warning');
            return;
        }
        
        // Validate code syntax
        const validation = CodeParser.validateCode(code);
        if (!validation.isValid) {
            this.showMessage(`Code validation failed: ${validation.errors.join(', ')}`, 'error');
            return;
        }
        
        // Parse the code
        const parseResult = this.codeParser.parse(code, structureType);
        
        if (!parseResult.success) {
            this.showMessage(`Parsing failed: ${parseResult.error}`, 'error');
            return;
        }
        
        // Initialize visualization
        const success = this.visualizer.initialize(parseResult);
        
        if (success) {
            this.showMessage('Code parsed successfully! Use the controls to step through the execution.', 'success');
            this.updateStructureInfo();
        } else {
            this.showMessage('Failed to initialize visualization.', 'error');
        }
    }

    resetVisualization() {
        this.visualizer.reset();
        this.showMessage('Visualization reset.', 'info');
    }

    togglePlayPause() {
        if (this.visualizer.isPlaying) {
            this.visualizer.pause();
        } else {
            this.visualizer.play();
        }
    }

    previousStep() {
        this.visualizer.previousStep();
        this.updateStructureInfo();
    }

    nextStep() {
        this.visualizer.nextStep();
        this.updateStructureInfo();
    }

    stopAnimation() {
        this.visualizer.stop();
        this.updateStructureInfo();
    }

    handleSpeedChange(event) {
        const speed = parseFloat(event.target.value);
        this.visualizer.setSpeed(speed);
    }

    openSettings() {
        document.getElementById('settingsModal').classList.add('active');
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    updateStructureInfo() {
        const structureDetails = document.getElementById('structureDetails');
        if (structureDetails && this.visualizer.currentStructure) {
            structureDetails.innerHTML = this.visualizer.getStructureDetails();
        }
    }

    showMessage(message, type = 'info') {
        const explanationContent = document.getElementById('explanationContent');
        if (!explanationContent) return;
        
        const colors = {
            success: { bg: '#d1fae5', text: '#065f46', icon: '✅' },
            error: { bg: '#fee2e2', text: '#991b1b', icon: '❌' },
            warning: { bg: '#fef3c7', text: '#92400e', icon: '⚠️' },
            info: { bg: '#dbeafe', text: '#1e40af', icon: 'ℹ️' }
        };
        
        const color = colors[type] || colors.info;
        
        explanationContent.innerHTML = `
            <div style="
                color: ${color.text}; 
                background: ${color.bg}; 
                padding: 1rem; 
                border-radius: 6px; 
                border-left: 4px solid ${color.text};
                margin-bottom: 1rem;
            ">
                ${color.icon} ${message}
            </div>
        `;
        
        // Auto-clear after 5 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                if (explanationContent.innerHTML.includes(message)) {
                    explanationContent.innerHTML = '<p>Enter code above and click "Parse & Visualize" to begin the animation.</p>';
                }
            }, 5000);
        }
    }

    handleResize() {
        if (this.visualizer) {
            this.visualizer.resize();
        }
    }

    // Export functionality
    exportVisualization() {
        if (this.visualizer && this.visualizer.currentStructure) {
            this.visualizer.exportAsImage();
        } else {
            this.showMessage('No visualization to export.', 'warning');
        }
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (event.target.tagName === 'TEXTAREA') return; // Don't interfere with code editing
            
            switch (event.key) {
                case ' ': // Spacebar for play/pause
                    event.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft': // Previous step
                    event.preventDefault();
                    this.previousStep();
                    break;
                case 'ArrowRight': // Next step
                    event.preventDefault();
                    this.nextStep();
                    break;
                case 'Escape': // Stop/reset
                    event.preventDefault();
                    this.stopAnimation();
                    break;
                case 'Enter': // Parse (Ctrl+Enter)
                    if (event.ctrlKey) {
                        event.preventDefault();
                        this.parseAndVisualize();
                    }
                    break;
            }
        });
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new DataStructureVisualizer();
    
    // Make it globally available for debugging
    window.app = app;
    
    // Setup keyboard shortcuts
    app.setupKeyboardShortcuts();
    
    console.log('🚀 Data Structure Visualizer initialized successfully!');
});