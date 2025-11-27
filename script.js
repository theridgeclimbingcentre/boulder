// --- 1. INITIAL SETUP & DATA LOADING ---

// Define the PIN and default data
const ADMIN_PIN = "180923"; 
const defaultColors = ["Red", "Blue", "Green", "Yellow", "Black"];
const defaultSections = ["Section 1", "Section 2", "Section 3", "Full Lap"];
const defaultGrades = ["V0", "V1", "V2", "V3", "V4", "V5", "V6"];
const defaultInstructions = "Welcome! \n1. Use holds of the specified color(s).\n2. Don't fall!\n3. Have fun!";

// Load Data
let routes = JSON.parse(localStorage.getItem('traverseRoutes')) || [];
let config = JSON.parse(localStorage.getItem('traverseConfig')) || {
    colors: defaultColors,
    sections: defaultSections,
    grades: defaultGrades,
    instructions: defaultInstructions
};

let isAdminMode = false;

// Initialize App
init();

function init() {
    renderRoutes(routes);
    updateInstructionText();
    populateDropdowns();
    renderConfigLists();
    // Ensure the form starts in 'add' mode
    setFormMode('add');
}

// --- 2. ADMIN PIN LOGIC & TOGGLE ---

function promptForAdminPin() {
    const enteredPin = prompt("Please enter the Admin PIN:");

    if (enteredPin === ADMIN_PIN) {
        alert("Admin Mode activated!");
        isAdminMode = true;
        toggleAdminMode();
    } else if (enteredPin !== null) { 
        alert("Incorrect PIN.");
        // If they fail PIN, ensure they are logged out and the form is cleared
        isAdminMode = false;
        toggleAdminMode();
    }
}

function toggleAdminMode() {
    const configPanel = document.getElementById('configPanel');
    const addRoutePanel = document.getElementById('addRoutePanel');
    
    if (isAdminMode) {
        configPanel.classList.remove('hidden');
        addRoutePanel.classList.remove('hidden');
        setFormMode('add'); // Reset form to 'Add' when entering Admin Mode
    } else {
        configPanel.classList.add('hidden');
        addRoutePanel.classList.add('hidden');
    }
    
    filterRoutes();
}

// --- 3. CONFIGURATION LOGIC (Instructions, Colors, Sections, Grades) ---

function saveConfig() {
    localStorage.setItem('traverseConfig', JSON.stringify(config));
    populateDropdowns(); 
    renderConfigLists(); 
}

// Instructions
function updateInstructionText() {
    document.getElementById('instructionText').textContent = config.instructions;
    document.getElementById('editInstructions').value = config.instructions;
}

function saveInstructions() {
    const newText = document.getElementById('editInstructions').value;
    config.instructions = newText;
    saveConfig();
    updateInstructionText();
    alert("Instructions updated!");
}

// Color Management (omitting helpers for brevity, assume they remain the same)
function addColor() {
    const input = document.getElementById('newColor');
    const val = input.value.trim();
    if(val && !config.colors.includes(val)) {
        config.colors.push(val);
        input.value = '';
        saveConfig();
    }
}
function removeColor(index) {
    if(confirm("Remove this color? This will affect all future route entries.")) {
        config.colors.splice(index, 1);
        saveConfig();
    }
}
// Section Management
function addSection() {
    const input = document.getElementById('newSection');
    const val = input.value.trim();
    if(val && !config.sections.includes(val)) {
        config.sections.push(val);
        input.value = '';
        saveConfig();
    }
}
function removeSection(index) {
    if(confirm("Remove this section?")) {
        config.sections.splice(index, 1);
        saveConfig();
    }
}
// Grade Management
function addGrade() {
    const input = document.getElementById('newGrade');
    const val = input.value.trim().toUpperCase(); 
    if(val && !config.grades.includes(val)) {
        config.grades.push(val);
        config.grades.sort((a, b) => {
            const numA = parseInt(a.slice(1)) || 0; 
            const numB = parseInt(b.slice(1)) || 0;
            return numA - numB;
        });
        input.value = '';
        saveConfig();
    }
}
function removeGrade(index) {
    if(confirm("Remove this grade? This will affect filtering.")) {
        config.grades.splice(index, 1);
        saveConfig();
    }
}
// Render Config Lists (omitted for brevity)
function renderConfigLists() {
    // Renders Colors, Sections, and Grades in the Admin Panel
    const cDiv = document.getElementById('colorListDisplay');
    cDiv.innerHTML = config.colors.map((c, i) => 
        `<span class="tag">${c} <span class="tag-del" onclick="removeColor(${i})">x</span></span>`
    ).join('');

    const sDiv = document.getElementById('sectionListDisplay');
    sDiv.innerHTML = config.sections.map((s, i) => 
        `<span class="tag">${s} <span class="tag-del" onclick="removeSection(${i})">x</span></span>`
    ).join('');

    const gDiv = document.getElementById('gradeListDisplay');
    gDiv.innerHTML = config.grades.map((g, i) => 
        `<span class="tag">${g} <span class="tag-del" onclick="removeGrade(${i})">x</span></span>`
    ).join('');
}

// Helper to fill the <select> boxes with our dynamic data (omitted for brevity)
function populateDropdowns() {
    const c1 = document.getElementById('color1Select');
    const c2 = document.getElementById('color2Select');
    const sec = document.getElementById('sectionSelect');
    const gSelect = document.getElementById('gradeSelect');
    const gFilter = document.getElementById('gradeFilter');

    const createOptions = (arr) => arr.map(item => `<option value="${item}">${item}</option>`).join('');

    c1.innerHTML = `<option value="" disabled selected>Primary Color</option>` + createOptions(config.colors);
    c2.innerHTML = `<option value="None">No 2nd Color</option>` + createOptions(config.colors);
    sec.innerHTML = createOptions(config.sections);
    gSelect.innerHTML = createOptions(config.grades);
    
    gFilter.innerHTML = `<option value="All">All Grades</option>` + createOptions(config.grades);
}

// --- 4. ROUTE MANAGEMENT (Unified Save Logic and New Edit Logic) ---

function getFormValues() {
    const color1 = document.getElementById('color1Select').value;
    const color2 = document.getElementById('color2Select').value;
    
    let finalColors = color1;
    if (color2 !== "None") {
        finalColors = color1 + " + " + color2;
    }
    
    return {
        name: document.getElementById('routeName').value,
        colors: finalColors,
        section: document.getElementById('sectionSelect').value,
        grade: document.getElementById('gradeSelect').value,
        desc: document.getElementById('routeDesc').value,
        rawColor1: color1, // used for setting dropdowns back when editing
        rawColor2: color2
    };
}

function clearForm() {
    document.getElementById('routeName').value = "";
    document.getElementById('routeDesc').value = "";
    // Note: Dropdowns are not explicitly cleared, they default to their first/selected option
}

// NEW: Refactored save logic to handle both ADD and EDIT
function handleSaveClick() {
    const mode = document.getElementById('editMode').value;
    const formData = getFormValues();

    if (formData.name === "" || formData.rawColor1 === "") {
        alert("Please enter a Name and a Primary Color");
        return;
    }

    if (mode === 'add') {
        addNewRoute(formData);
    } else if (mode === 'edit') {
        saveEdit(formData);
    }
}

function addNewRoute(data) {
    const newRoute = {
        id: Date.now(),
        name: data.name,
        colors: data.colors,
        section: data.section,
        grade: data.grade,
        desc: data.desc
    };
    routes.push(newRoute);
    saveRoutes();
    clearForm();
    filterRoutes();
}

function saveEdit(data) {
    const routeId = parseInt(document.getElementById('editingRouteId').value);
    
    // Find the index of the route being edited
    const index = routes.findIndex(r => r.id === routeId);

    if (index !== -1) {
        // Update the route object with new data
        routes[index].name = data.name;
        routes[index].colors = data.colors;
        routes[index].section = data.section;
        routes[index].grade = data.grade;
        routes[index].desc = data.desc;
        
        saveRoutes();
        clearForm();
        setFormMode('add'); // Switch back to 'Add' mode after saving
        alert(`Route "${data.name}" updated successfully!`);
        filterRoutes();
    }
}

function deleteRoute(id) {
    if(confirm("Are you sure you want to delete this route?")) {
        routes = routes.filter(route => route.id !== id);
        saveRoutes();
        filterRoutes();
    }
}

function saveRoutes() {
    localStorage.setItem('traverseRoutes', JSON.stringify(routes));
}

// NEW: Function to prepare the form for editing
function editRoute(id) {
    const routeToEdit = routes.find(r => r.id === id);

    if (!routeToEdit) return;

    // 1. Switch the form to EDIT mode
    setFormMode('edit', id);

    // 2. Load the data into the form inputs
    document.getElementById('routeName').value = routeToEdit.name;
    document.getElementById('routeDesc').value = routeToEdit.desc;
    document.getElementById('sectionSelect').value = routeToEdit.section;
    document.getElementById('gradeSelect').value = routeToEdit.grade;

    // 3. Load the colors back into the dropdowns
    // We need to parse the 'Red + Blue' string to determine the raw colors.
    // This assumes the saved format is "Color1" or "Color1 + Color2"
    const savedColors = routeToEdit.colors.split(' + ');
    
    document.getElementById('color1Select').value = savedColors[0] || '';
    document.getElementById('color2Select').value = savedColors.length > 1 ? savedColors[1] : 'None';

    // 4. Scroll the form into view
    document.getElementById('addRoutePanel').scrollIntoView({ behavior: 'smooth' });
}

// NEW: Helper function to manage form appearance and mode
function setFormMode(mode, id = null) {
    const title = document.getElementById('formTitle');
    const button = document.getElementById('saveButton');
    const editModeInput = document.getElementById('editMode');
    const routeIdInput = document.getElementById('editingRouteId');

    if (mode === 'edit') {
        title.textContent = 'Edit Existing Route';
        button.textContent = 'Update Route';
        button.style.backgroundColor = '#ffc107'; // Yellow/Orange color for update
        editModeInput.value = 'edit';
        routeIdInput.value = id;
    } else { // mode === 'add'
        title.textContent = 'Add New Route';
        button.textContent = 'Save Route';
        button.style.backgroundColor = '#28a745'; // Green color for add
        editModeInput.value = 'add';
        routeIdInput.value = '';
        clearForm();
    }
}

// --- 5. DISPLAY & FILTER (Updated to include Edit button) ---

function renderRoutes(list) {
    const container = document.getElementById('routeList');
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p style='text-align:center'>No routes found.</p>";
        return;
    }

    list.forEach(route => {
        const div = document.createElement('div');
        div.className = 'route-card';
        
        // Show delete and EDIT buttons ONLY if isAdminMode is true
        const adminButtonsHTML = isAdminMode 
            ? `
            <button class="small-btn edit-btn" onclick="editRoute(${route.id})">Edit</button>
            <button class="delete-btn" onclick="deleteRoute(${route.id})">Delete</button>
            ` 
            : '';

        div.innerHTML = `
            <div class="route-header">
                <span>${route.name}</span>
                <span>${route.grade}</span>
            </div>
            <div class="route-details">
                <strong>${route.section}</strong> | Colors: ${route.colors}
            </div>
            <div class="route-desc">"${route.desc}"</div>
            <div class="admin-actions">
                ${adminButtonsHTML}
            </div>
        `;
        container.appendChild(div);
    });
}

function filterRoutes() {
    const grade = document.getElementById('gradeFilter').value;
    if (grade === "All") {
        renderRoutes(routes);
    } else {
        renderRoutes(routes.filter(r => r.grade === grade));
    }
}