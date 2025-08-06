# Data Structure Visualizer

An interactive web application for visualizing data structures and algorithms with step-by-step animations and explanations.

![Data Structure Visualizer](preview.png)

## 🚀 Features

### Phase 1: Foundational Development (MVP) ✅
- **Code Input and Parsing**: Enter JavaScript code for data structures and see it parsed into executable steps
- **Basic Visualization Engine**: Canvas-based rendering with support for multiple data structure types
- **Core Animation Loop**: State machine that steps through code execution with visual updates
- **Playback Controls**: Play, Pause, Next, Previous buttons for navigation

### Phase 2: Data Structures and Algorithms ✅
- **Linked List Visualization**: Create, insert, delete, and traverse linked list nodes
- **Array Visualization**: Array operations with insertion, deletion, and element access
- **Binary Search Tree**: Tree structure visualization with node connections
- **Sorting Algorithm Visualization**: Bubble sort with comparison and swap animations
- **Graph Visualization**: Basic graph structure with vertices and edges

### Phase 3: Enhanced User Experience ✅
- **Code-Visualization Synchronization**: Current line highlighting in code editor
- **Live Settings**: Customize node size, animation speed, and color schemes
- **Algorithm Explanations**: Detailed step-by-step explanations for each operation
- **Interactive Elements**: Click on nodes to see detailed information

### Phase 4: Advanced Features 🚧
- **Performance Visualization**: Metrics display for algorithm complexity
- **Multiple Language Support**: Currently supports JavaScript syntax
- **Export Functionality**: Save visualizations as images
- **Responsive Design**: Works on desktop and mobile devices

## 🎯 Supported Data Structures

1. **Linked Lists**
   - Node creation and linking
   - Insertion at beginning/end
   - Variable reference tracking

2. **Arrays**
   - Element access and modification
   - Push, pop, shift, unshift operations
   - Index-based operations

3. **Binary Search Trees**
   - Node creation and tree building
   - Left/right child assignments
   - Tree structure layout

4. **Graphs**
   - Vertex and edge creation
   - Basic graph structure

5. **Sorting Algorithms**
   - Bubble sort visualization
   - Element comparison highlighting
   - Swap operation animations

## 🎮 How to Use

1. **Select Data Structure**: Choose from the dropdown menu
2. **Enter Code**: Write or modify the JavaScript code in the editor
3. **Parse & Visualize**: Click the button to parse your code
4. **Control Playback**: Use the control buttons to step through execution
5. **Interact**: Click on elements to see detailed information
6. **Customize**: Use the settings panel to adjust appearance

## 🖥️ Running the Application

### Prerequisites
- Python 3.6+ (for development server)
- Modern web browser with ES6+ support

### Quick Start
1. Clone or download the project
2. Navigate to the project directory
3. Start the development server:
   ```bash
   npm start
   # or
   python3 -m http.server 8000
   ```
4. Open your browser to `http://localhost:8000`

### Development
The application is built with vanilla JavaScript and requires no build process. Simply edit the files and refresh the browser.

## 📁 Project Structure

```
data-structure-visualizer/
├── index.html              # Main HTML file
├── package.json            # Project configuration
├── README.md               # This file
├── styles/
│   └── main.css            # Application styles
└── js/
    ├── utils.js            # Utility functions
    ├── codeParser.js       # Code parsing engine
    ├── visualizer.js       # Main visualization engine
    ├── animationEngine.js  # Animation system
    ├── main.js             # Application controller
    ├── dataStructures/
    │   ├── linkedList.js   # Linked list visualization
    │   ├── array.js        # Array visualization
    │   ├── binarySearchTree.js # BST visualization
    │   └── graph.js        # Graph visualization
    └── algorithms/
        └── sorting.js      # Sorting algorithm visualization
```

## 🎨 Customization

### Color Schemes
- **Default**: Blue and purple gradients
- **Dark**: Dark theme with blue accents
- **Colorful**: Green, orange, and red theme

### Settings
- **Node Size**: 20px - 60px
- **Animation Duration**: 300ms - 2000ms
- **Animation Speed**: 0.5x - 3x playback speed

## 🔧 Code Examples

### Linked List
```javascript
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
```

### Array Operations
```javascript
let arr = [3, 1, 4, 1, 5];

// Insert element
arr.push(9);
arr.unshift(2);

// Access elements
let element = arr[2];

// Remove elements
arr.pop();
arr.shift();
```

### Binary Search Tree
```javascript
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
```

## ⌨️ Keyboard Shortcuts

- **Spacebar**: Play/Pause animation
- **← →**: Previous/Next step
- **Ctrl+Enter**: Parse and visualize code
- **Escape**: Stop animation

## 🤝 Contributing

This project is designed to be educational and extensible. To add new features:

1. **New Data Structures**: Extend `BaseVisualization` class
2. **New Algorithms**: Create specialized visualization classes
3. **Code Parsing**: Extend `CodeParser` class for new syntax
4. **Animations**: Use the `AnimationEngine` for smooth transitions

## 📚 Educational Use

This tool is perfect for:
- **Students**: Learning data structures and algorithms visually
- **Teachers**: Demonstrating concepts in computer science courses
- **Developers**: Understanding algorithm behavior and complexity
- **Interview Preparation**: Visualizing common coding problems

## 🔮 Future Enhancements

- **More Data Structures**: Stacks, queues, heaps, hash tables
- **Advanced Algorithms**: DFS, BFS, Dijkstra's, dynamic programming
- **Performance Analytics**: Time/space complexity visualization
- **Code Generation**: Generate code from visual manipulation
- **Collaborative Features**: Share visualizations with others
- **Multiple Languages**: Python, Java, C++ support

## 📄 License

MIT License - feel free to use this project for educational purposes.

## 🙏 Acknowledgments

Built with modern web technologies:
- **Canvas API** for high-performance rendering
- **ES6+ JavaScript** for clean, modular code
- **CSS Grid & Flexbox** for responsive layouts
- **Font Awesome** for beautiful icons
- **Inter Font** for clean typography

---

**Happy Learning! 🎓**