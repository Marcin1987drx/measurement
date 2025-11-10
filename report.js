// ════════════════════════════════════════════════════════════════════════════
// REPORT STUDIO - Main JavaScript
// ════════════════════════════════════════════════════════════════════════════

const reportState = {
    project: {
        rootHandle: null,
        name: 'No Project Selected',
        maps: [],
        records: []
    },
    ui: {
        theme: localStorage.getItem('theme') || 'light',
        language: localStorage.getItem('language') || 'en',
        zoom: 100,
        gridEnabled: true,
        snapEnabled: true,
        rulersEnabled: false,
        mode: 'designer'
    },
    template: {
        meta: { name: 'Untitled Report', paper: 'A4', orientation: 'portrait' },
        pages: [{ id: 1, components: [] }],
        currentPage: 1
    },
    selection: {
        elementId: null,
        elementType: null
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Report Studio initializing...');
    
    initializeTheme();
    initializeLanguage();
    loadProjectData();
    setupEventListeners();
    
    console.log('✅ Report Studio ready!');
});

function initializeTheme() {
    const isDark = reportState.ui.theme === 'dark';
    document.documentElement.classList.toggle('dark-mode', isDark);
    console.log(`🎨 Theme: ${reportState.ui.theme}`);
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    reportState.ui.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', reportState.ui.theme);
}

function initializeLanguage() {
    const langSelect = document.getElementById('language-toggle');
    if (langSelect) langSelect.value = reportState.ui.language;
    document.body.setAttribute('lang', reportState.ui.language);
}

function changeLanguage(lang) {
    reportState.ui.language = lang;
    localStorage.setItem('language', lang);
    document.body.setAttribute('lang', lang);
}

function loadProjectData() {
    try {
        const projectDataStr = sessionStorage.getItem('measurementProject');
        if (projectDataStr) {
            const projectData = JSON.parse(projectDataStr);
            reportState.project.name = projectData.name || 'Unknown Project';
            reportState.project.maps = projectData.maps || [];
            reportState.project.records = projectData.records || [];
            updateProjectDisplay();
            console.log(`📁 Project: ${reportState.project.name}`);
        }
    } catch (error) {
        console.error('❌ Error loading project:', error);
    }
}

function updateProjectDisplay() {
    const el = document.getElementById('project-folder-name');
    if (el) el.textContent = reportState.project.name;
}

function setupEventListeners() {
    document.getElementById('btn-back-to-main')?.addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('language-toggle')?.addEventListener('change', (e) => changeLanguage(e.target.value));
    
    document.getElementById('btn-new-template')?.addEventListener('click', newTemplate);
    document.getElementById('btn-open-template')?.addEventListener('click', openTemplate);
    document.getElementById('btn-save-template')?.addEventListener('click', saveTemplate);
    document.getElementById('btn-preview')?.addEventListener('click', () => console.log('👁️ Preview'));
    document.getElementById('btn-generate-pdf')?.addEventListener('click', () => console.log('📄 Generate PDF'));
    
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => adjustZoom(25));
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => adjustZoom(-25));
    
    document.getElementById('toggle-grid')?.addEventListener('change', (e) => {
        reportState.ui.gridEnabled = e.target.checked;
        document.querySelectorAll('.canvas-page').forEach(p => p.classList.toggle('no-grid', !e.target.checked));
    });
    
    document.getElementById('btn-add-page')?.addEventListener('click', addPage);
    
    setupDragAndDrop();
}

function newTemplate() {
    if (confirm('Create new template?')) {
        reportState.template = {
            meta: { name: 'Untitled', paper: 'A4', orientation: 'portrait' },
            pages: [{ id: 1, components: [] }],
            currentPage: 1
        };
        console.log('📄 New template');
    }
}

function openTemplate() {
    document.getElementById('open-template-modal')?.classList.add('open');
}

function saveTemplate() {
    const name = prompt('Template name:', reportState.template.meta.name);
    if (name) {
        reportState.template.meta.name = name;
        console.log('💾 Saved:', name);
    }
}

function adjustZoom(delta) {
    reportState.ui.zoom = Math.max(50, Math.min(200, reportState.ui.zoom + delta));
    const el = document.getElementById('zoom-level');
    if (el) el.textContent = `${reportState.ui.zoom}%`;
    const container = document.getElementById('canvas-container');
    if (container) container.className = `canvas-container zoom-${reportState.ui.zoom}`;
}

function addPage() {
    const id = reportState.template.pages.length + 1;
    reportState.template.pages.push({ id, components: [] });
    
    const page = document.createElement('div');
    page.className = 'canvas-page';
    page.innerHTML = `<div class="page-header"><span class="page-number">Page ${id}</span></div><div class="page-content" id="page-content-${id}"></div>`;
    document.getElementById('canvas-container')?.appendChild(page);
    
    console.log(`📄 Page ${id} added`);
}

function setupDragAndDrop() {
    document.querySelectorAll('.component-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('componentType', e.target.dataset.type);
            e.target.style.opacity = '0.5';
        });
        item.addEventListener('dragend', (e) => e.target.style.opacity = '1');
    });
    
    document.querySelectorAll('.page-content').forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('componentType');
            if (type) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const el = document.createElement('div');
                el.className = 'canvas-element';
                el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:200px;height:50px;border:2px solid var(--accent-color);padding:8px;background:var(--bg-secondary);`;
                el.textContent = `[${type}]`;
                e.currentTarget.appendChild(el);
                
                console.log(`➕ ${type} at (${x}, ${y})`);
            }
        });
    });
}

console.log('📄 report.js loaded');