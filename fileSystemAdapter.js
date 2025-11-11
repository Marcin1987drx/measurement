class FileSystemAdapter {
    constructor() {
        this.mode = null;
        this.projectRoot = null;
    }

    async initialize() {
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

    async getImageURL(path) {
        if (this.mode === 'local') {
            const handle = await this.getHandle(path);
            const file = await handle.getFile();
            return URL.createObjectURL(file);
        }
        return `/api/files/image?project=${this.projectRoot}&path=${encodeURIComponent(path)}`;
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
        return await res.text();
    }

    async writeServer(path, data) {
        await fetch('/api/files/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: this.projectRoot, path, content: data })
        });
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
