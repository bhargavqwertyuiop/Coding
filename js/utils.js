// Utility functions for the Data Structure Visualizer

class Utils {
    // Color schemes for different themes
    static colorSchemes = {
        default: {
            node: '#667eea',
            nodeText: '#ffffff',
            edge: '#4a5568',
            highlight: '#764ba2',
            background: '#fdfdfd',
            text: '#2d3748'
        },
        dark: {
            node: '#4299e1',
            nodeText: '#ffffff',
            edge: '#a0aec0',
            highlight: '#63b3ed',
            background: '#1a202c',
            text: '#e2e8f0'
        },
        colorful: {
            node: '#48bb78',
            nodeText: '#ffffff',
            edge: '#ed8936',
            highlight: '#f56565',
            background: '#f7fafc',
            text: '#2d3748'
        }
    };

    // Get current color scheme
    static getCurrentColors() {
        const scheme = localStorage.getItem('colorScheme') || 'default';
        return this.colorSchemes[scheme];
    }

    // Animation easing functions
    static easing = {
        linear: t => t,
        easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeOut: t => t * (2 - t),
        easeIn: t => t * t,
        bounce: t => {
            if (t < 1/2.75) {
                return 7.5625 * t * t;
            } else if (t < 2/2.75) {
                return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
            } else if (t < 2.5/2.75) {
                return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
            } else {
                return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
            }
        }
    };

    // Generate unique ID
    static generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    // Calculate distance between two points
    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // Interpolate between two values
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    // Interpolate between two points
    static lerpPoint(start, end, t) {
        return {
            x: this.lerp(start.x, end.x, t),
            y: this.lerp(start.y, end.y, t)
        };
    }

    // Calculate angle between two points
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    // Format code for syntax highlighting (basic)
    static formatCode(code) {
        // Simple syntax highlighting
        return code
            .replace(/\b(class|function|let|const|var|if|else|for|while|return)\b/g, '<span class="keyword">$1</span>')
            .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
            .replace(/\b\d+\b/g, '<span class="number">$&</span>')
            .replace(/".*?"/g, '<span class="string">$&</span>')
            .replace(/'.*?'/g, '<span class="string">$&</span>');
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Calculate optimal node positioning for different layouts
    static calculateLayout = {
        // Linear layout for arrays and linked lists
        linear: (nodes, canvas, direction = 'horizontal') => {
            const positions = [];
            const nodeSize = parseInt(localStorage.getItem('nodeSize') || '40');
            const spacing = nodeSize * 2;
            const totalWidth = (nodes.length - 1) * spacing;
            const totalHeight = (nodes.length - 1) * spacing;

            if (direction === 'horizontal') {
                const startX = (canvas.width - totalWidth) / 2;
                const y = canvas.height / 2;
                
                nodes.forEach((node, index) => {
                    positions.push({
                        x: startX + index * spacing,
                        y: y,
                        id: node.id || index
                    });
                });
            } else {
                const x = canvas.width / 2;
                const startY = (canvas.height - totalHeight) / 2;
                
                nodes.forEach((node, index) => {
                    positions.push({
                        x: x,
                        y: startY + index * spacing,
                        id: node.id || index
                    });
                });
            }

            return positions;
        },

        // Tree layout for binary trees
        tree: (nodes, canvas, rootId = null) => {
            if (nodes.length === 0) return [];

            const positions = [];
            const nodeSize = parseInt(localStorage.getItem('nodeSize') || '40');
            const levelHeight = nodeSize * 3;
            const minSpacing = nodeSize * 2;

            // Find root node
            const root = rootId ? nodes.find(n => n.id === rootId) : nodes[0];
            if (!root) return [];

            // BFS to assign levels
            const levels = new Map();
            const queue = [{node: root, level: 0, position: 0}];
            const visited = new Set();

            while (queue.length > 0) {
                const {node, level, position} = queue.shift();
                
                if (visited.has(node.id)) continue;
                visited.add(node.id);

                if (!levels.has(level)) {
                    levels.set(level, []);
                }
                levels.get(level).push({node, position});

                // Add children to queue
                if (node.left) {
                    queue.push({node: node.left, level: level + 1, position: position * 2});
                }
                if (node.right) {
                    queue.push({node: node.right, level: level + 1, position: position * 2 + 1});
                }
            }

            // Calculate positions for each level
            const maxLevel = Math.max(...levels.keys());
            const maxWidth = Math.pow(2, maxLevel) * minSpacing;

            levels.forEach((levelNodes, level) => {
                const y = 50 + level * levelHeight;
                const levelWidth = Math.pow(2, level) * minSpacing;
                const startX = (canvas.width - levelWidth) / 2;

                levelNodes.forEach(({node, position}) => {
                    const x = startX + (position + 0.5) * (levelWidth / Math.pow(2, level));
                    positions.push({
                        x: Math.max(nodeSize, Math.min(canvas.width - nodeSize, x)),
                        y: y,
                        id: node.id,
                        level: level
                    });
                });
            });

            return positions;
        },

        // Grid layout for graphs
        grid: (nodes, canvas) => {
            const positions = [];
            const nodeSize = parseInt(localStorage.getItem('nodeSize') || '40');
            const cols = Math.ceil(Math.sqrt(nodes.length));
            const rows = Math.ceil(nodes.length / cols);
            
            const cellWidth = (canvas.width - 100) / cols;
            const cellHeight = (canvas.height - 100) / rows;

            nodes.forEach((node, index) => {
                const row = Math.floor(index / cols);
                const col = index % cols;
                
                positions.push({
                    x: 50 + col * cellWidth + cellWidth / 2,
                    y: 50 + row * cellHeight + cellHeight / 2,
                    id: node.id || index
                });
            });

            return positions;
        },

        // Force-directed layout for graphs
        forceDirected: (nodes, edges, canvas, iterations = 100) => {
            const positions = new Map();
            const velocities = new Map();
            const nodeSize = parseInt(localStorage.getItem('nodeSize') || '40');

            // Initialize random positions
            nodes.forEach(node => {
                positions.set(node.id, {
                    x: Math.random() * (canvas.width - 100) + 50,
                    y: Math.random() * (canvas.height - 100) + 50
                });
                velocities.set(node.id, {x: 0, y: 0});
            });

            // Force-directed algorithm
            for (let iter = 0; iter < iterations; iter++) {
                const forces = new Map();
                
                // Initialize forces
                nodes.forEach(node => {
                    forces.set(node.id, {x: 0, y: 0});
                });

                // Repulsive forces between all nodes
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const node1 = nodes[i];
                        const node2 = nodes[j];
                        const pos1 = positions.get(node1.id);
                        const pos2 = positions.get(node2.id);
                        
                        const dx = pos1.x - pos2.x;
                        const dy = pos1.y - pos2.y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                        
                        const repulsion = 1000 / (distance * distance);
                        const fx = (dx / distance) * repulsion;
                        const fy = (dy / distance) * repulsion;
                        
                        const force1 = forces.get(node1.id);
                        const force2 = forces.get(node2.id);
                        
                        force1.x += fx;
                        force1.y += fy;
                        force2.x -= fx;
                        force2.y -= fy;
                    }
                }

                // Attractive forces for connected nodes
                edges.forEach(edge => {
                    const pos1 = positions.get(edge.from);
                    const pos2 = positions.get(edge.to);
                    
                    if (pos1 && pos2) {
                        const dx = pos2.x - pos1.x;
                        const dy = pos2.y - pos1.y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                        
                        const attraction = distance * 0.01;
                        const fx = (dx / distance) * attraction;
                        const fy = (dy / distance) * attraction;
                        
                        const force1 = forces.get(edge.from);
                        const force2 = forces.get(edge.to);
                        
                        force1.x += fx;
                        force1.y += fy;
                        force2.x -= fx;
                        force2.y -= fy;
                    }
                });

                // Update positions
                nodes.forEach(node => {
                    const pos = positions.get(node.id);
                    const vel = velocities.get(node.id);
                    const force = forces.get(node.id);
                    
                    vel.x = (vel.x + force.x) * 0.85; // Damping
                    vel.y = (vel.y + force.y) * 0.85;
                    
                    pos.x += vel.x;
                    pos.y += vel.y;
                    
                    // Keep within bounds
                    pos.x = Math.max(nodeSize, Math.min(canvas.width - nodeSize, pos.x));
                    pos.y = Math.max(nodeSize, Math.min(canvas.height - nodeSize, pos.y));
                });
            }

            // Convert to array format
            return nodes.map(node => ({
                x: positions.get(node.id).x,
                y: positions.get(node.id).y,
                id: node.id
            }));
        }
    };

    // Local storage helpers
    static storage = {
        get: (key, defaultValue = null) => {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch {
                return defaultValue;
            }
        },
        
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('Failed to save to localStorage:', e);
            }
        },
        
        remove: (key) => {
            localStorage.removeItem(key);
        }
    };

    // Performance monitoring
    static performance = {
        start: (label) => {
            console.time(label);
        },
        
        end: (label) => {
            console.timeEnd(label);
        },
        
        measure: (fn, label = 'operation') => {
            const start = performance.now();
            const result = fn();
            const end = performance.now();
            console.log(`${label} took ${end - start} milliseconds`);
            return result;
        }
    };
}