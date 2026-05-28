# QR Code Generator and Scanner

A lightweight, highly responsive, and premium glassmorphic single-page web utility to generate and scan QR codes natively from your browser. The application features a modern frosted-glass interface with harmonized color palettes, smooth hover micro-animations, and full offline-first capability.

## Features

### QR Generator
* Supports multiple formats: Text/URL, Wi-Fi configuration networks, and standard vCard 3.0 contact cards.
* Wi-Fi configurations automatically escape special characters in compliance with ZXing specifications.
* Contact cards use CRLF delimiters in compliance with RFC 2426 specifications.
* Real-time debounced generation to prevent CPU flickering during typing.

### QR Scanner
* Dual scan methods: drag-and-drop local image file upload, or live WebRTC camera streaming.
* Live camera stream automatically detects and targets the rear/environment camera using soft constraints to bypass Brave Shields and Chromium anti-fingerprinting blocks.
* Safe camera initialization delay of 450ms to prevent Android hardware driver lockups.
* Native flashlight (torch) toggle integrated directly into the browser viewport (supported on Chromium-based mobile browsers).

### Native Web Share
* Integrated with the native Web Share API to easily share generated QR Code PNG files or scanned text directly to other apps (WhatsApp, Telegram, email, etc.) with a single click.
* Provides a clean fallback confirmation modal on desktop browsers that do not support native sharing.

### Activity History
* Automatic localStorage logging for all scanned or successfully generated items.
* Limit threshold set at 50 items to keep browsers lightweight.
* Debounced saving of 1.5 seconds on the generator tab to prevent logging intermediate keystrokes.
* Detail panel for recreating old QR codes, downloading PNGs, copying text, or opening valid URLs.

### Privacy and Performance
* Runs 100% offline-first.
* No remote font calls (all fonts are loaded locally using a high-quality local TrueType font file).
* Minimal network latency, zero tracking scripts, and zero analytical cookies.

## Project Structure

The project has been separated into clean modular files for enhanced maintainability:

* index.html: Contains the semantic HTML5 structure, navigation pill headers, scan method panels, and dynamic confirmation modals.
* style.css: Holds all design tokens, glassmorphism blur and tint effects, linear gradients, active senter glow animations, and responsive mobile layout queries.
* script.js: Encapsulates all JavaScript logic, including Webrtc video canvas checking loops, jsQR processing, debounce utilities, localStorage saving, and native Web Share file construction.
* logo.png: The customized premium brand logo used as the browser tab favicon.
* zh-cn.ttf: The local TrueType font file providing high-quality global typography.

## Deployment on GitHub Pages

This project is fully ready for deployment on GitHub Pages. To deploy:

1. Initialize a Git repository in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Create a new repository on GitHub.
3. Link your local repository to GitHub and push your code:
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```
4. On GitHub, navigate to your repository settings, go to the "Pages" tab on the left sidebar, choose the "main" branch as your source, and click Save.
5. Your application will be live at `https://your-username.github.io/your-repo-name/` within a few minutes.

## Local Execution

Due to security constraints implemented in modern browsers (CORS policies), opening index.html directly from your file system (using the `file://` protocol) may block the camera or local font file loading. 

For the best experience, run a local development server in the project folder:

### Python
If you have Python installed, run:
```bash
python -m http.server 8080
```
Then navigate to `http://localhost:8080` in your browser.

### Node.js (npm)
If you have Node.js installed, run:
```bash
npx http-server
```

## Technologies Used

* HTML5 and CSS3
* Vanilla JavaScript (ES6+)
* Bootstrap Icons (via CDN stylesheet)
* QRCodeJS (via CDN for client-side generation)
* jsQR (via CDN for client-side image/video scanning)
