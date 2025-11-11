const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('.'));

const PROJECTS = './projects';

app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.post('/api/files/read', async (req, res) => {
    const { project, path: filePath } = req.body;
    const content = await fs.readFile(path.join(PROJECTS, project, filePath), 'utf-8');
    res.send(content);
});

app.post('/api/files/write', async (req, res) => {
    const { project, path: filePath, content } = req.body;
    const fullPath = path.join(PROJECTS, project, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
    res.json({ ok: true });
});

app.get('/api/files/image', async (req, res) => {
    const { project, path: imgPath } = req.query;
    res.sendFile(path.resolve(PROJECTS, project, imgPath));
});

app.listen(3000, () => console.log('Server: http://localhost:3000'));
