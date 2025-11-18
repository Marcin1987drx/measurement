class BackgroundManager {
    /**
     * Migrate old background data structure to new format
     * Converts legacy backgroundFile property to backgrounds array
     * @param {Object} mapData - Map data object to migrate
     * @returns {Object} Migrated map data
     */
    static migrate(mapData) {
        if (!mapData) return mapData;
        
        const meta = mapData.meta = mapData.meta || {};
        meta.backgrounds = meta.backgrounds || [];
        
        console.log('🔄 Migrating background data...');
        
        if (meta.backgroundFile && meta.backgrounds.length === 0) {
            const bgId = `bg_migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            meta.backgrounds.push({ 
                id: bgId, 
                name: 'Default Background', 
                fileName: meta.backgroundFile 
            });
            meta.globalBackgroundId = bgId;
        }
        
        if (meta.defaultBackground && !meta.globalBackgroundId) {
            meta.globalBackgroundId = meta.defaultBackground;
        }
        if (meta.backgroundId && !meta.globalBackgroundId) {
            meta.globalBackgroundId = meta.backgroundId;
        }
        
        if (mapData.points) {
            mapData.points.forEach(point => {
                if (point.backgroundId && !point.pointBackgroundId) {
                    point.pointBackgroundId = point.backgroundId;
                    delete point.backgroundId;
                }
            });
        }
        
        delete meta.backgroundFile;
        delete meta.defaultBackground;
        delete meta.backgroundId;
        
        console.log('✅ Background migration complete');
        return mapData;
    }
    
    /**
     * Get the active background ID for display
     * Returns point-specific background if point is selected, otherwise global background
     * @param {Object} mapData - Map data object
     * @param {string|null} selectedPointId - ID of selected point (optional)
     * @returns {string|null} Active background ID or null
     */
    static getActiveBackgroundId(mapData, selectedPointId = null) {
        if (!mapData?.meta?.backgrounds) return null;
        
        if (selectedPointId) {
            const point = mapData.points?.find(p => p.id === selectedPointId);
            if (point?.pointBackgroundId) return point.pointBackgroundId;
        }
        
        return mapData.meta.globalBackgroundId || null;
    }
    
    /**
     * Get background object by ID
     * @param {Object} mapData - Map data object
     * @param {string} backgroundId - Background ID to look up
     * @returns {Object|null} Background object or null if not found
     */
    static getBackgroundById(mapData, backgroundId) {
        if (!backgroundId || !mapData?.meta?.backgrounds) return null;
        return mapData.meta.backgrounds.find(bg => bg.id === backgroundId) || null;
    }
    
    /**
     * Get the filename of the active background
     * @param {Object} mapData - Map data object
     * @param {string|null} selectedPointId - ID of selected point (optional)
     * @returns {string|null} Background filename or null
     */
    static getBackgroundFileName(mapData, selectedPointId = null) {
        const bgId = this.getActiveBackgroundId(mapData, selectedPointId);
        const bg = this.getBackgroundById(mapData, bgId);
        return bg?.fileName || null;
    }
    
    /**
     * Get all points that should be visible for a given background
     * Filters points based on their background assignment
     * @param {Object} mapData - Map data object
     * @param {string} activeBackgroundFileName - Filename of currently active background
     * @returns {Array} Array of visible measurement points
     */
    static getVisiblePoints(mapData, activeBackgroundFileName) {
        if (!mapData?.points) return [];
        
        const { points, meta } = mapData;
        
        if (!activeBackgroundFileName) {
            return points.filter(mp => !mp.pointBackgroundId);
        }
        
        const activeBg = meta.backgrounds?.find(b => b.fileName === activeBackgroundFileName);
        if (!activeBg) {
            console.warn(`⚠️ Background not found: ${activeBackgroundFileName}`);
            console.log('Available backgrounds:', meta.backgrounds?.map(b => b.fileName));
            return [];
        }
        
        const isGlobal = activeBg.id === meta.globalBackgroundId;
        
        return points.filter(mp => {
            if (isGlobal) {
                // Problem #16: Show orphaned points (without pointBackgroundId) on global background
                // This ensures points without a specific background assignment are always visible
                return !mp.pointBackgroundId || mp.pointBackgroundId === meta.globalBackgroundId;
            }
            return mp.pointBackgroundId === activeBg.id;
        });
    }
}

window.backgroundManager = BackgroundManager;
