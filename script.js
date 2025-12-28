/* JPG to PDF Converter - client-side only */
(() => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const previewList = document.getElementById('previewList');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const progressEl = document.getElementById('progress');
    const progressText = document.getElementById('progressText');
    const pageSizeEl = document.getElementById('pageSize');
    const orientationEl = document.getElementById('orientation');
    const qualityEl = document.getElementById('quality');
    const modeSelect = document.getElementById('modeSelect');

    // Setup pdfjs worker if available
    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
        try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'; } catch (e) { /* ignore */ }
    }

    let items = [];
    let dragSrcIndex = null;

    function updateButtons() {
        const has = items.length > 0;
        convertBtn.disabled = !has;
        clearBtn.disabled = !has;
    }

    function showProgress(show, msg = 'Working') {
        if (show) {
            progressEl.classList.remove('hidden');
            progressText.textContent = msg;
        } else {
            progressEl.classList.add('hidden');
            progressText.textContent = '';
        }
    }

    function handleFilesSelected(list) {
        const accepted = [];
        const rejected = [];
        const mode = modeSelect ? modeSelect.value : 'jpg2pdf';
        Array.from(list).forEach(f => {
            const name = f.name || 'file';
            const ext = name.split('.').pop().toLowerCase();
            const isImage = f.type && f.type.startsWith('image');
            const isPdf = f.type === 'application/pdf' || ext === 'pdf';
            const isDocx = f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx';
            // only accept the types for the currently selected mode to avoid confusion
            const modeAllowed = (mode === 'jpg2pdf' && isImage) || ((mode === 'pdf2jpg' || mode === 'pdf2word') && isPdf) || ((mode === 'word2pdf' || mode === 'word2jpg') && isDocx);
            if (!modeAllowed) {
                rejected.push(f);
                return;
            }
            const url = URL.createObjectURL(f);
            const kind = isImage ? 'image' : isPdf ? 'pdf' : 'docx';
            accepted.push({ file: f, url, name, kind });
        });
        if (rejected.length) {
            alert('Some files were skipped — check the selected mode and file types (JPG/JPEG, PDF, DOCX).');
        }
        items = items.concat(accepted);
        renderPreviews();
        updateButtons();
    }

    fileInput.addEventListener('change', (e) => {
        handleFilesSelected(e.target.files);
        fileInput.value = '';
    });

    // Drag & drop add
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', (e) => {
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files) {
            handleFilesSelected(e.dataTransfer.files);
        }
    });
    // Make drop zone clickable and keyboard accessible
    dropZone.addEventListener('click', (e) => fileInput.click());
    dropZone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  // Prevent default drop opening files in browser
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());
    // adjust accept based on mode
    function updateAcceptByMode() {
        const mode = modeSelect ? modeSelect.value : 'jpg2pdf';
        if (mode === 'jpg2pdf') fileInput.accept = 'image/jpeg,image/jpg';
        else if (mode === 'pdf2jpg' || mode === 'pdf2word') fileInput.accept = 'application/pdf';
        else if (mode === 'word2pdf' || mode === 'word2jpg') fileInput.accept = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else fileInput.accept = '*/*';
    }
    if (modeSelect) {
        function updateConvertButtonText() {
            const label = convertBtn.querySelector('.btn-text');
            const v = modeSelect.value;
            if (label) {
                if (v === 'jpg2pdf' || v === 'word2pdf') label.textContent = 'Convert to PDF';
                else if (v === 'pdf2jpg' || v === 'word2jpg') label.textContent = 'Convert to JPG';
                else if (v === 'pdf2word') label.textContent = 'Convert to Word';
                else label.textContent = 'Convert';
            }
        }
        updateConvertButtonText();
        modeSelect.addEventListener('change', () => {
            updateAcceptByMode();
            // update drop text
            const p = dropZone.querySelector('.drop-content p');
            if (p) {
                if (modeSelect.value === 'jpg2pdf') p.textContent = 'Drag & drop JPG images here or';
                else if (modeSelect.value === 'pdf2jpg' || modeSelect.value === 'pdf2word') p.textContent = 'Drag & drop PDF files here or';
                else if (modeSelect.value === 'word2pdf' || modeSelect.value === 'word2jpg') p.textContent = 'Drag & drop DOCX files here or';
                else p.textContent = 'Drag & drop files here or';
            }
            renderPreviews();
            updateConvertButtonText();
        });
        updateAcceptByMode();
    }

    function renderPreviews() {
    previewList.innerHTML = '';
        if (!items.length) {
            const el = document.createElement('div');
            el.className = 'preview-empty';
            const mode = modeSelect ? modeSelect.value : 'jpg2pdf';
            let hint = 'No files selected. Add files via drag & drop or Browse.';
            if (mode === 'jpg2pdf') hint = 'No images selected. Add JPG/JPEG images via drag & drop or Browse.';
            if (mode === 'pdf2jpg') hint = 'No PDF selected. Add PDF files to convert to JPG.';
            if (mode === 'word2pdf') hint = 'No Word doc selected. Add DOCX files to convert to PDF.';
            if (mode === 'pdf2word') hint = 'No PDF selected. Add PDF files to convert to Word (images).';
            if (mode === 'word2jpg') hint = 'No Word doc selected. Add DOCX files to convert to JPG images.';
            el.textContent = hint;
      previewList.appendChild(el);
      return;
    }
        items.forEach((img, i) => {
      const div = document.createElement('div');
      div.className = 'preview-item';
      div.setAttribute('draggable', 'true');
      div.dataset.index = i;
      div.tabIndex = 0;

            const badge = document.createElement('div');
      badge.className = 'order-badge';
      badge.textContent = (i + 1).toString();
      div.appendChild(badge);
            if (img.kind === 'image') {
                const imgEl = document.createElement('img');
                imgEl.className = 'thumb';
                imgEl.src = img.url;
                imgEl.alt = img.name;
                div.appendChild(imgEl);
            } else {
                const icon = document.createElement('div');
                icon.className = 'thumb';
                icon.innerHTML = img.kind === 'pdf' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"/></svg>';
                icon.style.display = 'flex';
                icon.style.alignItems = 'center';
                icon.style.justifyContent = 'center';
                icon.style.fontSize = '12px';
                icon.style.color = 'var(--muted)';
                div.appendChild(icon);
            }

      const meta = document.createElement('div');
      meta.className = 'preview-meta';

    const left = document.createElement('div');
      left.className = 'meta-left';
      left.textContent = img.name;
      meta.appendChild(left);

      const right = document.createElement('div');
      right.className = 'meta-right';

      // Move up
      const upBtn = document.createElement('button');
      upBtn.className = 'icon-btn';
      upBtn.title = 'Move up';
      upBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14l5-5 5 5z"/></svg>';
      upBtn.addEventListener('click', () => move(i, i - 1));
      right.appendChild(upBtn);

      // Move down
      const downBtn = document.createElement('button');
      downBtn.className = 'icon-btn';
      downBtn.title = 'Move down';
      downBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>';
      downBtn.addEventListener('click', () => move(i, i + 1));
      right.appendChild(downBtn);

      // Remove
      const rmBtn = document.createElement('button');
      rmBtn.className = 'icon-btn';
      rmBtn.title = 'Remove';
      rmBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
      rmBtn.addEventListener('click', () => remove(i));
      right.appendChild(rmBtn);

      meta.appendChild(right);
      div.appendChild(meta);

      // Drag handlers for reorder
      div.addEventListener('dragstart', (e) => {
        dragSrcIndex = i;
        div.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      div.addEventListener('dragend', () => {
        dragSrcIndex = null;
        div.classList.remove('dragging');
      });
      div.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      div.addEventListener('drop', (e) => {
        e.preventDefault();
        const trgIndex = Number(div.dataset.index);
        if (dragSrcIndex === null || dragSrcIndex === trgIndex) return;
        reorder(dragSrcIndex, trgIndex);
      });

      previewList.appendChild(div);
    });
  }

      function move(from, to) {
          if (to < 0 || to >= items.length) return;
          const arr = items.slice();
          const [item] = arr.splice(from, 1);
        arr.splice(to, 0, item);
          items = arr;
        renderPreviews();
    }
    function reorder(from, to) { move(from, to); }
    function remove(index) {
        const [removed] = items.splice(index, 1);
        if (removed && removed.url) URL.revokeObjectURL(removed.url);
        renderPreviews();
        updateButtons();
    }

    clearBtn.addEventListener('click', () => {
        items.forEach(i => i.url && URL.revokeObjectURL(i.url));
        items = [];
        renderPreviews();
        updateButtons();
    });

    // Conversion
    convertBtn.addEventListener('click', async () => {
        if (!items.length) return;
        showProgress(true, 'Starting...');
        try {
            const mode = modeSelect ? modeSelect.value : 'jpg2pdf';
            if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF not loaded');
            const { jsPDF } = window.jspdf;
            const size = pageSizeEl.value; // a4 or letter
            const orientation = orientationEl.value;
            const quality = parseFloat(qualityEl.value) || 0.9;
            const doc = new jsPDF({ unit: 'mm', format: size, orientation });
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const margin = 8; // mm
            if (mode === 'jpg2pdf') {
              const images = items.filter(it => it.kind === 'image');
              for (let i = 0; i < images.length; i++) {
                const imgObj = images[i];
                showProgress(true, `Converting ${i + 1} / ${images.length}`);
                // load as HTMLImage
                await new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = async () => {
                        // calculate target dims
                        let w = image.width;
                        let h = image.height;
                        const ratio = w / h;
                        const availW = pageW - margin * 2;
                        const availH = pageH - margin * 2;
                        let targetW = availW;
                        let targetH = targetW / ratio;
                        if (targetH > availH) {
                            targetH = availH;
                            targetW = targetH * ratio;
                        }

                        // draw to canvas to compress/normalize
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.round(image.width);
                        canvas.height = Math.round(image.height);
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(image, 0, 0);
                        const dataUrl = canvas.toDataURL('image/jpeg', quality);

                        // Add image to PDF; center on page
                        const x = (pageW - targetW) / 2;
                        const y = (pageH - targetH) / 2;
                        doc.addImage(dataUrl, 'JPEG', x, y, targetW, targetH);

                        if (i < images.length - 1) doc.addPage();
                        resolve();
                    };
                    image.onerror = (ev) => {
                        console.error('Image load error', ev);
                        reject(new Error('Failed to load image for conversion.'));
                    };
                    image.src = imgObj.url;
                });
                            }
                        } else if (mode === 'pdf2jpg') {
                            await convertPdfToJpg(items.filter(it => it.kind === 'pdf'), quality);
                        } else if (mode === 'word2pdf') {
                            await convertWordToPdf(items.filter(it => it.kind === 'docx'), size, orientation, quality);
                        } else if (mode === 'pdf2word') {
                            await convertPdfToWord(items.filter(it => it.kind === 'pdf'));
                        } else if (mode === 'word2jpg') {
                            await convertWordToJpg(items.filter(it => it.kind === 'docx'), quality);
                        }

            showProgress(true, 'Finalizing...');
            // Save the PDF
            if (mode === 'jpg2pdf') {
              const time = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
              doc.save(`images-${time}.pdf`);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while generating the PDF. See console for details.');
        } finally {
            showProgress(false);
        }
    });

    // initial
    renderPreviews();
    updateButtons();
    showProgress(false);
    async function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function convertPdfToJpg(pdfItems, quality = 0.9) {
        if (!pdfItems.length) return;
        if (!window.pdfjsLib) throw new Error('pdf.js not loaded');
        const zip = new JSZip();
        for (let idx = 0; idx < pdfItems.length; idx++) {
            const it = pdfItems[idx];
            showProgress(true, `Processing ${it.name}`);
            const buffer = await it.file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
            const folder = zip.folder(it.name.replace(/\.[^/.]+$/, '')) || zip;
            for (let p = 1; p <= pdf.numPages; p++) {
                const page = await pdf.getPage(p);
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                const blob = await (await fetch(dataUrl)).blob();
                folder.file(`page-${p}.jpg`, blob);
            }
        }
        showProgress(true, 'Preparing ZIP...');
        const content = await zip.generateAsync({ type: 'blob' });
        await downloadBlob(content, `pdf-pages-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.zip`);
    }

    async function addCanvasToPdfPages(canvas, doc, pageW, pageH, margin) {
        const pxToMm = (px) => px * 25.4 / 96;
        const imgWmm = pxToMm(canvas.width);
        const imgHmm = pxToMm(canvas.height);
        const targetWmm = pageW - margin * 2;
        const scale = targetWmm / imgWmm;
        const scaledHeightMm = imgHmm * scale;
        const sliceHeightMm = pageH - margin * 2;
        const slices = Math.ceil(scaledHeightMm / sliceHeightMm);
        const sliceHeightPx = Math.floor(canvas.height / slices);
        for (let s = 0; s < slices; s++) {
            const tmp = document.createElement('canvas');
            tmp.width = canvas.width;
            tmp.height = Math.min(sliceHeightPx, canvas.height - s * sliceHeightPx);
            const ctx = tmp.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, tmp.width, tmp.height);
            ctx.drawImage(canvas, 0, s * sliceHeightPx, tmp.width, tmp.height, 0, 0, tmp.width, tmp.height);
            const dataUrl = tmp.toDataURL('image/jpeg', 0.95);
            const hMm = pxToMm(tmp.height) * scale;
            const x = (pageW - targetWmm) / 2;
            const y = (pageH - hMm) / 2;
            doc.addImage(dataUrl, 'JPEG', x, y, targetWmm, hMm);
            if (s < slices - 1) doc.addPage();
        }
    }

    async function convertWordToPdf(docxItems, size = 'a4', orientation = 'portrait', quality = 0.9) {
        if (!docxItems.length) return;
        if (!mammoth) throw new Error('mammoth not loaded');
        for (let idx = 0; idx < docxItems.length; idx++) {
            const it = docxItems[idx];
            showProgress(true, `Converting ${it.name}`);
            const buffer = await it.file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
            const div = document.createElement('div');
            div.style.width = '900px';
            div.innerHTML = result.value;
            div.style.position = 'fixed';
            div.style.left = '-9999px';
            document.body.appendChild(div);
            const canvas = await html2canvas(div, { scale: 2 });
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: size, orientation });
            await addCanvasToPdfPages(canvas, doc, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 8);
            const blob = doc.output('blob');
            await downloadBlob(blob, `${it.name.replace(/\.[^/.]+$/, '')}.pdf`);
            div.remove();
        }
    }

    async function convertPdfToWord(pdfItems) {
        if (!pdfItems.length) return;
        if (!window.pdfjsLib) throw new Error('pdf.js not loaded');
        if (!docx) throw new Error('docx not loaded');
        for (let idx = 0; idx < pdfItems.length; idx++) {
            const it = pdfItems[idx];
            showProgress(true, `Converting ${it.name}`);
            const buffer = await it.file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
            const doc = new docx.Document();
            for (let p = 1; p <= pdf.numPages; p++) {
                const page = await pdf.getPage(p);
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                const blob = await (await fetch(dataUrl)).blob();
                const arrayBuf = await blob.arrayBuffer();
                const image = await arrayBuf;
                doc.addSection({ children: [new docx.Paragraph({ children: [new docx.ImageRun({ data: image, transformation: { width: 600, height: Math.round(600 * (canvas.height / canvas.width)) } })] })] });
            }
            const out = await docx.Packer.toBlob(doc);
            await downloadBlob(out, `${it.name.replace(/\.[^/.]+$/, '')}.docx`);
        }
    }

    async function convertWordToJpg(docxItems, quality = 0.9) {
        if (!docxItems.length) return;
        if (!mammoth) throw new Error('mammoth not loaded');
        const zip = new JSZip();
        for (let idx = 0; idx < docxItems.length; idx++) {
            const it = docxItems[idx];
            showProgress(true, `Converting ${it.name}`);
            const buffer = await it.file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
            const div = document.createElement('div');
            div.style.width = '900px';
            div.innerHTML = result.value;
            div.style.position = 'fixed';
            div.style.left = '-9999px';
            document.body.appendChild(div);
            const canvas = await html2canvas(div, { scale: 2 });
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            const blob = await (await fetch(dataUrl)).blob();
            const folder = zip.folder(it.name.replace(/\.[^/.]+$/, '')) || zip;
            folder.file('page-1.jpg', blob);
            div.remove();
        }
        const content = await zip.generateAsync({ type: 'blob' });
        await downloadBlob(content, `word-images-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.zip`);
    }
    })();
