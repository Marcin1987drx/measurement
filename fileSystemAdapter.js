class FileSystemAdapter {
    constructor() {
        this.mode = null;
        this.projectRoot = null;
        this.dbName = 'MeasurementHandlesDB';
        this.dbVersion = 1;
        this.storeName = 'directoryHandles';
        this.imageURLCache = new Map(); // Track created blob URLs for cleanup
    }

    /**
     * Open or create the IndexedDB database for storing directory handles
     * @returns {Promise<IDBDatabase>} The opened database
     */
    async openHandlesDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                console.log('✅ IndexedDB opened successfully');
                resolve(request.result);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('🔧 Upgrading IndexedDB schema...');
                const db = event.target.result;
                
                // Create object store for directory handles if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                    console.log('✅ Created directoryHandles object store');
                }
            };
        });
    }

    /**
     * Save a directory handle to IndexedDB
     * @param {FileSystemDirectoryHandle} handle - The directory handle to save
     * @returns {Promise<void>}
     */
    async saveHandleToIndexedDB(handle) {
        try {
            const db = await this.openHandlesDB();
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // Store the handle with a fixed key 'lastProject'
            const data = {
                id: 'lastProject',
                handle: handle,
                name: handle.name,
                savedAt: Date.now()
            };
            
            store.put(data);
            
            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => {
                    console.log('✅ Directory handle saved to IndexedDB:', handle.name);
                    db.close();
                    resolve();
                };
                
                transaction.onerror = () => {
                    console.error('❌ Failed to save handle to IndexedDB:', transaction.error);
                    db.close();
                    reject(transaction.error);
                };
            });
        } catch (error) {
            console.error('❌ Error in saveHandleToIndexedDB:', error);
            throw error;
        }
    }

    /**
     * Try to restore directory handle from IndexedDB without user gesture
     * @returns {Promise<FileSystemDirectoryHandle|null>} The saved handle or null if not found/no permission
     */
    async tryRestoreFromIndexedDB() {
        try {
            const db = await this.openHandlesDB();
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.get('lastProject');
                
                request.onsuccess = async () => {
                    db.close();
                    
                    if (!request.result || !request.result.handle) {
                        console.log('ℹ️ No saved directory handle found');
                        resolve(null);
                        return;
                    }
                    
                    const savedHandle = request.result.handle;
                    
                    // Verify we still have permission to access this handle
                    try {
                        const permission = await savedHandle.queryPermission({ mode: 'readwrite' });
                        
                        if (permission === 'granted') {
                            console.log('✅ File System auto-restored:', savedHandle.name);
                            resolve(savedHandle);
                        } else {
                            console.log('⚠️ No permission for saved handle (requires user gesture to renew)');
                            resolve(null);
                        }
                    } catch (error) {
                        console.error('❌ Error verifying handle permission:', error);
                        resolve(null);
                    }
                };
                
                request.onerror = () => {
                    console.error('❌ Failed to retrieve handle from IndexedDB:', request.error);
                    db.close();
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('❌ Error in tryRestoreFromIndexedDB:', error);
            return null;
        }
    }

    /**
     * Renew permission for a saved handle with user gesture
     * @returns {Promise<FileSystemDirectoryHandle|null>} The handle with renewed permission or null
     */
    async renewPermission() {
        try {
            const db = await this.openHandlesDB();
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.get('lastProject');
                
                request.onsuccess = async () => {
                    db.close();
                    
                    if (!request.result || !request.result.handle) {
                        console.log('ℹ️ No saved directory handle found to renew');
                        resolve(null);
                        return;
                    }
                    
                    const savedHandle = request.result.handle;
                    
                    try {
                        // Request permission - this requires user gesture
                        const permission = await savedHandle.requestPermission({ mode: 'readwrite' });
                        
                        if (permission === 'granted') {
                            console.log('✅ Permission renewed for:', savedHandle.name);
                            resolve(savedHandle);
                        } else {
                            console.log('❌ Permission denied by user');
                            resolve(null);
                        }
                    } catch (error) {
                        console.error('❌ Error requesting permission:', error);
                        resolve(null);
                    }
                };
                
                request.onerror = () => {
                    console.error('❌ Failed to retrieve handle from IndexedDB:', request.error);
                    db.close();
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('❌ Error in renewPermission:', error);
            return null;
        }
    }

    async initialize() {
        // First, try to restore from IndexedDB (works without user gesture if permission still valid)
        const restoredHandle = await this.tryRestoreFromIndexedDB();
        
        if (restoredHandle) {
            this.mode = 'local';
            this.projectRoot = restoredHandle;
            localStorage.setItem('fsMode', 'local');
            console.log('✅ File System initialized from IndexedDB:', restoredHandle.name);
            return restoredHandle;
        }
        
        // Fallback to traditional initialization
        if (window.location.protocol === 'file:') {
            this.mode = 'local';
            return await this.initLocal();
        }
        
        const hasAPI = await fetch('/api/ping').then(r => r.ok).catch(() => false);
        this.mode = hasAPI ? 'server' : 'local';
        return hasAPI ? await this.initServer() : await this.initLocal();
    }

    async initLocal() {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        this.projectRoot = handle;
        localStorage.setItem('fsMode', 'local');
        
        // Save handle to IndexedDB for future sessions
        await this.saveHandleToIndexedDB(handle);
        
        return handle;
    }

    async initServer() {
        const projectId = prompt('Project name:', 'G65');
        this.projectRoot = projectId;
        localStorage.setItem('fsMode', 'server');
        return projectId;
    }

    async readFile(path) {
        return this.mode === 'local' ? this.readLocal(path) : this.readServer(path);
    }

    async writeFile(path, data) {
        return this.mode === 'local' ? this.writeLocal(path, data) : this.writeServer(path, data);
    }

    /**
     * Get URL for an image file (creates blob URL for local mode, returns API URL for server mode)
     * Automatically manages blob URL lifecycle to prevent memory leaks
     * @param {string} path - Path to the image file
     * @returns {Promise<string>} URL to the image (blob URL or server API URL)
     */
    async getImageURL(path) {
        if (this.mode === 'local') {
            // Revoke previous URL for this path if it exists
            if (this.imageURLCache.has(path)) {
                URL.revokeObjectURL(this.imageURLCache.get(path));
            }
            
            const handle = await this.getHandle(path);
            const file = await handle.getFile();
            const url = URL.createObjectURL(file);
            
            // Cache the URL for future cleanup
            this.imageURLCache.set(path, url);
            return url;
        }
        return `/api/files/image?project=${this.projectRoot}&path=${encodeURIComponent(path)}`;
    }

    /**
     * Revoke a specific image URL to prevent memory leaks
     * @param {string} path - Path to the image file
     */
    revokeImageURL(path) {
        if (this.imageURLCache.has(path)) {
            URL.revokeObjectURL(this.imageURLCache.get(path));
            this.imageURLCache.delete(path);
            console.log(`✅ Revoked URL for: ${path}`);
        }
    }

    /**
     * Revoke all cached image URLs to prevent memory leaks
     */
    revokeAllImageURLs() {
        for (const [path, url] of this.imageURLCache.entries()) {
            URL.revokeObjectURL(url);
        }
        this.imageURLCache.clear();
        console.log('✅ All cached image URLs revoked');
    }

    async readLocal(path) {
        const handle = await this.getHandle(path);
        const file = await handle.getFile();
        return await file.text();
    }

    async writeLocal(path, data) {
        const handle = await this.getHandle(path, true);
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
    }

    async readServer(path) {
        const res = await fetch('/api/files/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: this.projectRoot, path })
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        return await res.text();
    }

    async writeServer(path, data) {
        const res = await fetch('/api/files/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: this.projectRoot, path, content: data })
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
    }

    async getHandle(path, create = false) {
        const parts = path.split('/').filter(p => p);
        let handle = this.projectRoot;
        for (let i = 0; i < parts.length - 1; i++) {
            handle = await handle.getDirectoryHandle(parts[i], { create });
        }
        return await handle.getFileHandle(parts[parts.length - 1], { create });
    }
}

window.fileSystemAdapter = new FileSystemAdapter();
