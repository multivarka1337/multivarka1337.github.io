document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const clearBtn = document.getElementById('clear-btn');
    const fileList = document.getElementById('file-list');
    let files = [];

    // Загрузка последних файлов
    loadRecentFiles();

    // Обработчики для drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('dragover');
    }

    function unhighlight() {
        dropArea.classList.remove('dragover');
    }

    // Обработка drop
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        handleFiles(droppedFiles);
    }

    // Обработка выбора файлов через кнопку
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    // Обработка файлов
    function handleFiles(fileList) {
        for (let file of fileList) {
            if (validateFile(file)) {
                addFile(file);
            }
        }
        updateUI();
    }

    function validateFile(file) {
        // Проверка размера (500MB)
        if (file.size > 500 * 1024 * 1024) {
            alert(`Файл ${file.name} слишком большой. Максимальный размер: 500MB`);
            return false;
        }
        
        // Проверка расширения
        const allowedExtensions = ['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar'];
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(extension)) {
            alert(`Файл ${file.name} имеет недопустимый формат.`);
            return false;
        }
        
        return true;
    }

    function addFile(file) {
        files.push({
            file: file,
            id: Date.now() + Math.random(),
            name: file.name,
            size: formatFileSize(file.size),
            status: 'pending'
        });
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateUI() {
        fileList.innerHTML = '';
        
        if (files.length === 0) {
            fileList.innerHTML = '<p class="empty-message">Файлы не выбраны</p>';
            uploadBtn.disabled = true;
            return;
        }
        
        uploadBtn.disabled = false;
        
        files.forEach(fileData => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            fileElement.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">
                        <i class="fas fa-file"></i>
                    </div>
                    <div>
                        <h4>${fileData.name}</h4>
                        <p class="file-size">${fileData.size}</p>
                    </div>
                </div>
                <button class="file-remove" onclick="removeFile(${fileData.id})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileList.appendChild(fileElement);
        });
    }

    window.removeFile = function(id) {
        files = files.filter(f => f.id !== id);
        updateUI();
    };

    // Очистка всех файлов
    clearBtn.addEventListener('click', function() {
        files = [];
        updateUI();
    });

    // Загрузка файлов
    uploadBtn.addEventListener('click', async function() {
        if (files.length === 0) return;
        
        const password = document.getElementById('password').value;
        
        // Показываем прогресс
        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        progressContainer.style.display = 'block';
        uploadBtn.disabled = true;
        
        for (let i = 0; i < files.length; i++) {
            const fileData = files[i];
            const formData = new FormData();
            formData.append('file', fileData.file);
            if (password) {
                formData.append('password', password);
            }
            
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                // Обновляем прогресс
                const progress = ((i + 1) / files.length) * 100;
                progressFill.style.width = progress + '%';
                progressText.textContent = Math.round(progress) + '%';
                
                if (result.success) {
                    showResult(result);
                    loadRecentFiles(); // Обновляем список файлов
                } else {
                    alert(`Ошибка при загрузке ${fileData.name}: ${result.error}`);
                }
            } catch (error) {
                alert(`Ошибка сети при загрузке ${fileData.name}`);
            }
        }
        
        // Скрываем прогресс и очищаем файлы
        setTimeout(() => {
            progressContainer.style.display = 'none';
            files = [];
            updateUI();
            uploadBtn.disabled = false;
        }, 1000);
    });

    function showResult(result) {
        const resultContainer = document.getElementById('result-container');
        const downloadLink = document.getElementById('download-link');
        
        downloadLink.value = result.download_url;
        resultContainer.style.display = 'block';
        
        // Настройка кнопок для sharing
        const shareUrl = encodeURIComponent(result.download_url);
        const shareText = encodeURIComponent('Скачай мой файл: ');
        
        document.getElementById('share-whatsapp').href = 
            `https://wa.me/?text=${shareText}%20${shareUrl}`;
        document.getElementById('share-telegram').href = 
            `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;
        document.getElementById('share-email').href = 
            `mailto:?subject=Файл для скачивания&body=Скачай файл по ссылке: ${result.download_url}`;
        
        // Прокрутка к результату
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Загрузка списка последних файлов
    async function loadRecentFiles() {
        const container = document.getElementById('recent-files-container');
        const loading = document.getElementById('loading-files');
        
        try {
            const response = await fetch('/api/files');
            const files = await response.json();
            
            container.innerHTML = '';
            
            if (files.length === 0) {
                container.innerHTML = '<p class="empty-message">Файлы еще не загружались</p>';
                return;
            }
            
            files.forEach(file => {
                const fileCard = document.createElement('div');
                fileCard.className = 'file-card';
                fileCard.innerHTML = `
                    <div class="file-card-header">
                        <div class="file-card-icon">
                            <i class="fas fa-file"></i>
                        </div>
                        <div class="file-card-name" title="${file.original_filename}">
                            ${file.original_filename}
                        </div>
                    </div>
                    <div class="file-card-meta">
                        <p><i class="fas fa-calendar"></i> ${new Date(file.upload_date).toLocaleDateString()}</p>
                        <p><i class="fas fa-weight-hanging"></i> ${formatFileSize(file.file_size)}</p>
                        <p><i class="fas fa-download"></i> Скачиваний: ${file.download_count}</p>
                    </div>
                    <div class="file-card-actions">
                        <a href="${file.download_url}" target="_blank" class="btn btn-small btn-primary">
                            <i class="fas fa-external-link-alt"></i> Открыть
                        </a>
                        <button onclick="copyToClipboard('${file.download_url}')" class="btn btn-small btn-secondary">
                            <i class="fas fa-copy"></i> Копировать
                        </button>
                    </div>
                `;
                container.appendChild(fileCard);
            });
        } catch (error) {
            container.innerHTML = '<p class="error-message">Ошибка при загрузке файлов</p>';
        } finally {
            loading.style.display = 'none';
        }
    }

    // Функция копирования ссылки
    window.copyLink = function() {
        const linkInput = document.getElementById('download-link');
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        
        navigator.clipboard.writeText(linkInput.value)
            .then(() => {
                const copyBtn = document.querySelector('.btn-copy');
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
                copyBtn.classList.add('btn-success');
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('btn-success');
                }, 2000);
            });
    };

    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert('Ссылка скопирована в буфер обмена!');
            })
            .catch(err => {
                console.error('Ошибка копирования:', err);
            });
    };

    // Инициализация
    updateUI();
});
