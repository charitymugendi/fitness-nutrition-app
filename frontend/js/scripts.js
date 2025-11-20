// ... (path import needed for this section)
const path = require('path');
// ... (The rest of your setup)

// Define the path to the 'frontend' folder (used below)
const frontendPath = path.join(__dirname, '..', 'frontend');

// ... (Existing Middleware: app.use(express.static(frontendPath));)

// Define the default route (/) to serve index.html (Already done)
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// 🌟 NEW ROUTES TO SERVE OTHER PAGES 🌟
app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'signup.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'login.html'));
});

// You may also want to add this for pages like about, contact, etc.
app.get('/:page.html', (req, res) => {
    const page = req.params.page;
    res.sendFile(path.join(frontendPath, `${page}.html`), (err) => {
        if (err) {
            // If the file doesn't exist, send a 404
            res.status(404).send('Page Not Found');
        }
    });
});
// 🌟 END OF NEW ROUTES 🌟

// ... (Your /api/workouts/videos endpoint goes here)