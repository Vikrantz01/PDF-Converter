# JPG to PDF Converter (Client-side)

This is a small, modern, responsive web application that converts JPG/JPEG images into a single PDF file entirely in the browser (no backend required).

Features
- Drag & Drop or file browse to select one or multiple JPG/JPEG, PDF, or DOCX files
- Image preview with reorder (drag, move up/down, remove)
- Convert JPG → PDF, PDF → JPG, Word (DOCX) → PDF, PDF → Word (images), Word → JPG
- Page size selection (A4, Letter)
- Orientation selection (Portrait, Landscape)
- Image quality control (compression)
- Loading / progress indicator
- Responsive layout for mobile, tablet, and desktop

How to use
1. Open `index.html` in a browser (modern browsers recommended), or serve the folder with a simple static server (recommended) using `npx http-server` or `python -m http.server`.
2. Choose a conversion Mode (top-right), then drag files matching that mode into the drop area, or click "Browse Files".
3. Reorder or remove images as needed.
4. Choose page size, orientation, and image quality.
5. Click "Convert to PDF" and download will start automatically.

Technical notes
- Uses `jsPDF` via CDN (https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js)
- All operations happen client-side; images are not uploaded to any server.
 - Note: PDF→Word converts pages into images inside a Word file (not editable text). Word→PDF/JPG use an approximate HTML conversion and may not preserve all formatting.

License
This is provided as an example without warranty. Use as you like.
