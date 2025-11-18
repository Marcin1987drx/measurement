class ProjectManager {
    constructor() {
        this.storageKey = 'measurementProject';
    }
    
    async save(projectData) {
        try {
            if (!projectData) return false;
            
            const data = {
                name: projectData.name || 'Unknown Project',
                lastAccess: Date.now(),
                maps: projectData.maps || [],
                records: projectData.records || []
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log(`✅ Project saved: "${data.name}" (${data.records.length} records)`);
            return true;
        } catch (error) {
            console.error('❌ Error saving project:', error);
            return false;
        }
    }
    
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return null;
            
            const project = JSON.parse(data);
            console.log(`📂 Project loaded: "${project.name}"`);
            return project;
        } catch (error) {
            console.error('❌ Error loading project:', error);
            return null;
        }
    }
    
    clear() {
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ Project cleared');
    }
}

window.projectManager = new ProjectManager();
