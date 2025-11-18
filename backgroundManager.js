class BackgroundManager {
    static migrate(mapData) {
        if (!mapData) return mapData;
        
        const meta = mapData.meta = mapData.meta || {};
        meta.backgrounds = meta.backgrounds || [];
        
        console.log('🔄 Migrating background data...');
        
        if (meta.backgroundFile && meta.backgrounds.length === 0) {
            const bgId = `bg_migrated_${Date.now()}`;
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
    
    static getActiveBackgroundId(mapData, selectedPointId = null) {
        if (!mapData?.meta?.backgrounds) return null;
        
        if (selectedPointId) {
            const point = mapData.points?.find(p => p.id === selectedPointId);
            if (point?.pointBackgroundId) return point.pointBackgroundId;
        }
        
        return mapData.meta.globalBackgroundId || null;
    }
    
    static getBackgroundById(mapData, backgroundId) {
        if (!backgroundId || !mapData?.meta?.backgrounds) return null;
        return mapData.meta.backgrounds.find(bg => bg.id === backgroundId) || null;
    }
    
    static getBackgroundFileName(mapData, selectedPointId = null) {
        const bgId = this.getActiveBackgroundId(mapData, selectedPointId);
        const bg = this.getBackgroundById(mapData, bgId);
        return bg?.fileName || null;
    }
    
    static getVisiblePoints(mapData, activeBackgroundFileName) {
        if (!mapData?.points) return [];
        
        const { points, meta } = mapData;
        
        if (!activeBackgroundFileName) {
            return points.filter(mp => !mp.pointBackgroundId);
        }
        
        const activeBg = meta.backgrounds?.find(b => b.fileName === activeBackgroundFileName);
        if (!activeBg) return [];
        
        const isGlobal = activeBg.id === meta.globalBackgroundId;
        
        return points.filter(mp => {
            if (isGlobal) {
                return !mp.pointBackgroundId || mp.pointBackgroundId === meta.globalBackgroundId;
            }
            return mp.pointBackgroundId === activeBg.id;
        });
    }
}

window.backgroundManager = BackgroundManager;
