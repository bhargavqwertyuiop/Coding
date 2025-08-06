// Animation Engine for smooth transitions

class AnimationEngine {
    constructor() {
        this.activeAnimations = new Map();
        this.animationId = 0;
        this.isRunning = false;
        this.fps = 60;
        this.frameTime = 1000 / this.fps;
        this.lastFrameTime = 0;
        
        this.startAnimationLoop();
    }

    // Start the main animation loop
    startAnimationLoop() {
        const animate = (currentTime) => {
            if (currentTime - this.lastFrameTime >= this.frameTime) {
                this.updateAnimations(currentTime);
                this.lastFrameTime = currentTime;
            }
            
            if (this.isRunning || this.activeAnimations.size > 0) {
                requestAnimationFrame(animate);
            }
        };
        
        this.isRunning = true;
        requestAnimationFrame(animate);
    }

    // Update all active animations
    updateAnimations(currentTime) {
        const completedAnimations = [];
        
        this.activeAnimations.forEach((animation, id) => {
            const elapsed = currentTime - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            const easedProgress = animation.easing(progress);
            
            // Update animation values
            this.updateAnimationValues(animation, easedProgress);
            
            // Call update callback
            if (animation.onUpdate) {
                animation.onUpdate(animation.target, easedProgress);
            }
            
            // Check if animation is complete
            if (progress >= 1) {
                if (animation.onComplete) {
                    animation.onComplete(animation.target);
                }
                completedAnimations.push(id);
            }
        });
        
        // Remove completed animations
        completedAnimations.forEach(id => {
            this.activeAnimations.delete(id);
        });
    }

    // Update individual animation values
    updateAnimationValues(animation, progress) {
        Object.keys(animation.from).forEach(key => {
            const from = animation.from[key];
            const to = animation.to[key];
            
            if (typeof from === 'number' && typeof to === 'number') {
                animation.target[key] = Utils.lerp(from, to, progress);
            } else if (from && to && typeof from === 'object' && from.x !== undefined) {
                // Handle point objects
                animation.target[key] = Utils.lerpPoint(from, to, progress);
            }
        });
    }

    // Create a new animation
    animate({
        target,
        from,
        to,
        duration = 800,
        easing = Utils.easing.easeInOut,
        onUpdate = null,
        onComplete = null,
        delay = 0
    }) {
        const id = this.animationId++;
        
        const startAnimation = () => {
            // Set initial values
            Object.keys(from).forEach(key => {
                target[key] = from[key];
            });
            
            const animation = {
                target,
                from: { ...from },
                to: { ...to },
                duration,
                easing,
                onUpdate,
                onComplete,
                startTime: performance.now()
            };
            
            this.activeAnimations.set(id, animation);
            
            if (!this.isRunning) {
                this.startAnimationLoop();
            }
        };
        
        if (delay > 0) {
            setTimeout(startAnimation, delay);
        } else {
            startAnimation();
        }
        
        return id;
    }

    // Animate node movement
    animateNodeMove(node, targetX, targetY, duration = 800, easing = Utils.easing.easeOut) {
        return this.animate({
            target: node,
            from: { x: node.x, y: node.y },
            to: { x: targetX, y: targetY },
            duration,
            easing
        });
    }

    // Animate node appearance
    animateNodeAppear(node, duration = 600, easing = Utils.easing.bounce) {
        const originalSize = node.size || 40;
        node.size = 0;
        node.opacity = 0;
        
        return this.animate({
            target: node,
            from: { size: 0, opacity: 0 },
            to: { size: originalSize, opacity: 1 },
            duration,
            easing
        });
    }

    // Animate node disappearance
    animateNodeDisappear(node, duration = 400, easing = Utils.easing.easeIn) {
        const originalSize = node.size || 40;
        
        return this.animate({
            target: node,
            from: { size: originalSize, opacity: 1 },
            to: { size: 0, opacity: 0 },
            duration,
            easing
        });
    }

    // Animate node highlight
    animateNodeHighlight(node, duration = 300) {
        const originalColor = node.color;
        const colors = Utils.getCurrentColors();
        
        return this.animate({
            target: node,
            from: { highlightIntensity: 0 },
            to: { highlightIntensity: 1 },
            duration: duration / 2,
            easing: Utils.easing.easeOut,
            onComplete: () => {
                this.animate({
                    target: node,
                    from: { highlightIntensity: 1 },
                    to: { highlightIntensity: 0 },
                    duration: duration / 2,
                    easing: Utils.easing.easeIn
                });
            }
        });
    }

    // Animate edge drawing
    animateEdgeDraw(edge, duration = 500, easing = Utils.easing.easeOut) {
        return this.animate({
            target: edge,
            from: { progress: 0 },
            to: { progress: 1 },
            duration,
            easing
        });
    }

    // Animate array element swap
    animateArraySwap(element1, element2, duration = 600, easing = Utils.easing.easeInOut) {
        const pos1 = { x: element1.x, y: element1.y };
        const pos2 = { x: element2.x, y: element2.y };
        
        const anim1 = this.animateNodeMove(element1, pos2.x, pos2.y, duration, easing);
        const anim2 = this.animateNodeMove(element2, pos1.x, pos1.y, duration, easing);
        
        return Promise.all([anim1, anim2]);
    }

    // Animate tree traversal
    animateTreeTraversal(nodes, duration = 2000) {
        const delayPerNode = duration / nodes.length;
        
        return new Promise((resolve) => {
            let completed = 0;
            
            nodes.forEach((node, index) => {
                this.animateNodeHighlight(node, 400);
                
                setTimeout(() => {
                    completed++;
                    if (completed === nodes.length) {
                        resolve();
                    }
                }, index * delayPerNode + 400);
            });
        });
    }

    // Animate graph search
    animateGraphSearch(path, duration = 1500) {
        const delayPerStep = duration / path.length;
        
        return new Promise((resolve) => {
            path.forEach((step, index) => {
                setTimeout(() => {
                    if (step.type === 'node') {
                        this.animateNodeHighlight(step.element, 300);
                    } else if (step.type === 'edge') {
                        this.animateEdgeHighlight(step.element, 300);
                    }
                    
                    if (index === path.length - 1) {
                        setTimeout(resolve, 300);
                    }
                }, index * delayPerStep);
            });
        });
    }

    // Animate edge highlight
    animateEdgeHighlight(edge, duration = 300) {
        return this.animate({
            target: edge,
            from: { highlightIntensity: 0 },
            to: { highlightIntensity: 1 },
            duration: duration / 2,
            easing: Utils.easing.easeOut,
            onComplete: () => {
                this.animate({
                    target: edge,
                    from: { highlightIntensity: 1 },
                    to: { highlightIntensity: 0 },
                    duration: duration / 2,
                    easing: Utils.easing.easeIn
                });
            }
        });
    }

    // Animate sorting comparison
    animateComparison(element1, element2, duration = 400) {
        const originalY1 = element1.y;
        const originalY2 = element2.y;
        const liftHeight = 20;
        
        // Lift elements
        const lift1 = this.animate({
            target: element1,
            from: { y: originalY1 },
            to: { y: originalY1 - liftHeight },
            duration: duration / 4,
            easing: Utils.easing.easeOut
        });
        
        const lift2 = this.animate({
            target: element2,
            from: { y: originalY2 },
            to: { y: originalY2 - liftHeight },
            duration: duration / 4,
            easing: Utils.easing.easeOut
        });
        
        // Hold position
        setTimeout(() => {
            // Lower elements
            this.animate({
                target: element1,
                from: { y: originalY1 - liftHeight },
                to: { y: originalY1 },
                duration: duration / 4,
                easing: Utils.easing.easeIn
            });
            
            this.animate({
                target: element2,
                from: { y: originalY2 - liftHeight },
                to: { y: originalY2 },
                duration: duration / 4,
                easing: Utils.easing.easeIn
            });
        }, duration / 2);
        
        return Promise.all([lift1, lift2]);
    }

    // Animate value change
    animateValueChange(element, newValue, duration = 500) {
        const oldValue = element.value;
        
        return this.animate({
            target: element,
            from: { scale: 1, valueTransition: 0 },
            to: { scale: 1.2, valueTransition: 1 },
            duration: duration / 2,
            easing: Utils.easing.easeOut,
            onUpdate: (target, progress) => {
                if (progress > 0.5) {
                    target.value = newValue;
                }
            },
            onComplete: () => {
                this.animate({
                    target: element,
                    from: { scale: 1.2 },
                    to: { scale: 1 },
                    duration: duration / 2,
                    easing: Utils.easing.easeIn
                });
            }
        });
    }

    // Stop all animations
    stopAll() {
        this.activeAnimations.clear();
    }

    // Stop specific animation
    stop(animationId) {
        this.activeAnimations.delete(animationId);
    }

    // Pause all animations
    pause() {
        this.isRunning = false;
    }

    // Resume all animations
    resume() {
        if (this.activeAnimations.size > 0) {
            this.isRunning = true;
            this.startAnimationLoop();
        }
    }

    // Get number of active animations
    getActiveCount() {
        return this.activeAnimations.size;
    }

    // Chain animations
    chain(animations) {
        return new Promise((resolve) => {
            let currentIndex = 0;
            
            const runNext = () => {
                if (currentIndex >= animations.length) {
                    resolve();
                    return;
                }
                
                const animation = animations[currentIndex];
                currentIndex++;
                
                this.animate({
                    ...animation,
                    onComplete: (target) => {
                        if (animation.onComplete) {
                            animation.onComplete(target);
                        }
                        runNext();
                    }
                });
            };
            
            runNext();
        });
    }

    // Run animations in parallel
    parallel(animations) {
        const promises = animations.map(animation => {
            return new Promise((resolve) => {
                this.animate({
                    ...animation,
                    onComplete: (target) => {
                        if (animation.onComplete) {
                            animation.onComplete(target);
                        }
                        resolve();
                    }
                });
            });
        });
        
        return Promise.all(promises);
    }

    // Create a spring animation
    spring({
        target,
        from,
        to,
        stiffness = 100,
        damping = 10,
        mass = 1,
        onUpdate = null,
        onComplete = null
    }) {
        const id = this.animationId++;
        let velocity = {};
        
        // Initialize velocity for each property
        Object.keys(from).forEach(key => {
            velocity[key] = 0;
        });
        
        const animation = {
            target,
            from: { ...from },
            to: { ...to },
            velocity,
            stiffness,
            damping,
            mass,
            onUpdate,
            onComplete,
            startTime: performance.now(),
            isSpring: true
        };
        
        this.activeAnimations.set(id, animation);
        
        return id;
    }

    // Update spring animation
    updateSpringAnimation(animation, deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        let allSettled = true;
        
        Object.keys(animation.from).forEach(key => {
            const current = animation.target[key];
            const target = animation.to[key];
            const displacement = current - target;
            
            // Spring force: F = -k * x
            const springForce = -animation.stiffness * displacement;
            
            // Damping force: F = -c * v
            const dampingForce = -animation.damping * animation.velocity[key];
            
            // Total force
            const totalForce = springForce + dampingForce;
            
            // Acceleration: a = F / m
            const acceleration = totalForce / animation.mass;
            
            // Update velocity: v = v + a * dt
            animation.velocity[key] += acceleration * dt;
            
            // Update position: x = x + v * dt
            animation.target[key] += animation.velocity[key] * dt;
            
            // Check if settled (small displacement and velocity)
            if (Math.abs(displacement) > 0.1 || Math.abs(animation.velocity[key]) > 0.1) {
                allSettled = false;
            }
        });
        
        if (animation.onUpdate) {
            animation.onUpdate(animation.target, allSettled ? 1 : 0);
        }
        
        return allSettled;
    }
}

// Global animation engine instance
const animationEngine = new AnimationEngine();