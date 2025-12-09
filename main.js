// Главный JavaScript файл

// Инициализация переменных
let selectedFile = null;
let filesList = [];

// DOM элементы
const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-area');
const uploadBtn = document.getElementById('upload-btn');
const selectedFileDiv = document.getElementById('selected-file');
const selectedFileName = document.getElementById('selected-file-name');
const selectedFileSize = document.getElementById('selected-file-size');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const resultContainer = document.getElementById('result-container');
const downloadLink = document.getElementById('download-link');
const filesListDiv = document.getElementById('files-list');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем список файлов
    loadFiles();
    
    // Настройка drag and drop
    setupDragAndDrop();
    
    // Настройка выбора файла через input
    setupFileInput();
});

// Настройка drag and drop
function setupDragAndDrop() {
    // Предотвращаем стандартное поведение
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    // Подсветка области при перетаскивании
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Обработка drop
    dropArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.classList.add('dragover');
}

function unhighlight() {
    dropArea.classList.remove('dragover');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
}

// Настройка выбора файла через input
function setupFileInput() {
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFileSelect(this.files[0]);
        }
    });
}

// Обработка выбора файла
function handleFileSelect(file) {
    // Проверка размера файла (100MB максимум)
    if (file.size > 100 * 1024 * 1024) {
        showNotification('Файл слишком большой. Максимум 100MB', 'error');
        return;
    }
    
    selectedFile = file;
    
    // Показываем информацию о выбранном файле
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = formatFileSize(file.size);
    selectedFileDiv.style.display = 'block';
    
    // Активируем кнопку загрузки
    uploadBtn.disabled = false;
    
    // Прокручиваем к кнопке загрузки
    uploadBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Очистка выбранного файла
function clearFile() {
    selectedFile = null;
    selectedFileDiv.style.display = 'none';
    fileInput.value = '';
    uploadBtn.disabled = true;
}

// Загрузка файла
async function uploadFile() {
    if (!selectedFile) return;
    
    // Скрываем предыдущий результат
    resultContainer.style.display = 'none';
    
    // Показываем прогресс
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    
    // Имитация загрузки (в реальном приложении здесь будет запрос на сервер)
    for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        progressFill.style.width = i + '%';
        progressText.textContent = i + '%';
    }
    
    // Генерируем ссылку (в реальном приложении это будет URL от сервера)
    const fileId = generateFileId();
    const fileUrl = `${window.location.origin}/files/${fileId}/${encodeURIComponent(selectedFile.name)}`;
    
    // Сохраняем файл в localStorage (временное решение)
    saveFileToLocalStorage(fileId, selectedFile);
    
    // Показываем результат
    progressContainer.style.display = 'none';
    downloadLink.value = fileUrl;
    resultContainer.style.display = 'block';
    
    // Обновляем список файлов
    loadFiles();
    
    // Сбрасываем выбор
    clearFile();
    
    // Прокручиваем к результату
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// Генерация ID файла
function generateFileId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Сохранение файла в localStorage (имитация)
function saveFileToLocalStorage(fileId, file) {
    // В реальном приложении здесь будет запрос к серверу
    // Для демо сохраняем информацию о файле в localStorage
    
    const fileInfo = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        date: new Date().toISOString(),
        // В реальном приложении тут будет URL файла на сервере
        url: URL.createObjectURL(file) // Временная ссылка для демо
    };
    
    // Получаем текущий список файлов
    const files = JSON.parse(localStorage.getItem('files') || '[]');
    
    // Добавляем новый файл
    files.unshift(fileInfo);
    
    // Сохраняем обратно (ограничиваем 50 файлов)
    const limitedFiles = files.slice(0, 50);
    localStorage.setItem('files', JSON.stringify(limitedFiles));
    
    // Сохраняем сам файл как Data URL (только для маленьких файлов)
    if (file.size < 5 * 1024 * 1024) { // 5MB максимум для localStorage
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem(`file_data_${fileId}`, e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Загрузка списка файлов
function loadFiles() {
    // В реальном приложении здесь будет запрос к API
    // Для демо используем localStorage
    
    const files = JSON.parse(localStorage.getItem('files') || '[]');
    filesList = files;
    
    displayFiles(files);
}

// Отображение списка файлов
function displayFiles(files) {
    filesListDiv.innerHTML = '';
    
    if (files.length === 0) {
        filesListDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-folder-open"></i>
                </div>
                <h3>Файлы не найдены</h3>
                <p>Загрузите первый файл, чтобы увидеть его здесь</p>
            </div>
        `;
        return;
    }
    
    files.forEach(file => {
        const fileElement = createFileElement(file);
        filesListDiv.appendChild(fileElement);
    });
}

// Создание элемента файла
function createFileElement(file) {
    const div = document.createElement('div');
    div.className = 'file-item';
    
    // Определяем иконку по типу файла
    const fileIcon = getFileIcon(file.type);
    
    div.innerHTML = `
        <div class="file-icon ${fileIcon.class}">
            <i class="${fileIcon.icon}"></i>
        </div>
        <div class="file-info">
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-meta">
                <span class="file-size">
                    <i class="fas fa-weight-hanging"></i> ${formatFileSize(file.size)}
                </span>
                <span class="file-date">
                    <i class="far fa-calendar"></i> ${formatDate(file.date)}
                </span>
            </div>
        </div>
        <div class="file-actions">
            <button class="download-btn" onclick="downloadFile('${file.id}')">
                <i class="fas fa-download"></i> Скачать
            </button>
            <button class="delete-btn" onclick="deleteFile('${file.id}')">
                <i class="fas fa-trash"></i> Удалить
            </button>
        </div>
    `;
    
    return div;
}

// Определение иконки по типу файла
function getFileIcon(fileType) {
    if (!fileType) return { icon: 'fas fa-file', class: 'other' };
    
    if (fileType.includes('pdf')) {
        return { icon: 'fas fa-file-pdf', class: 'pdf' };
    } else if (fileType.includes('image')) {
        return { icon: 'fas fa-file-image', class: 'image' };
    } else if (fileType.includes('video')) {
        return { icon: 'fas fa-file-video', class: 'video' };
    } else if (fileType.includes('audio')) {
        return { icon: 'fas fa-file-audio', class: 'audio' };
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar') || fileType.includes('gz')) {
        return { icon: 'fas fa-file-archive', class: 'archive' };
    } else if (fileType.includes('text') || fileType.includes('document') || 
               fileType.includes('word') || fileType.includes('excel') || 
               fileType.includes('powerpoint')) {
        return { icon: 'fas fa-file-alt', class: 'document' };
    } else if (fileType.includes('javascript') || fileType.includes('html') || 
               fileType.includes('css') || fileType.includes('json') || 
               fileType.includes('xml')) {
        return { icon: 'fas fa-file-code', class: 'code' };
    } else {
        return { icon: 'fas fa-file', class: 'other' };
    }
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Скачивание файла
function downloadFile(fileId) {
    const file = filesList.find(f => f.id === fileId);
    if (!file) {
        showNotification('Файл не найден', 'error');
        return;
    }
    
    // В реальном приложении здесь будет редирект на сервер
    // Для демо используем сохраненные данные
    
    const fileData = localStorage.getItem(`file_data_${fileId}`);
    
    if (fileData) {
        // Используем сохраненные данные
        const link = document.createElement('a');
        link.href = fileData;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (file.url) {
        // Используем временную ссылку
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        showNotification('Не удалось скачать файл', 'error');
    }
    
    showNotification(`Файл "${file.name}" скачивается`, 'success');
}

// Удаление файла
function deleteFile(fileId) {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) {
        return;
    }
    
    // Удаляем из списка
    const files = JSON.parse(localStorage.getItem('files') || '[]');
    const filteredFiles = files.filter(f => f.id !== fileId);
    localStorage.setItem('files', JSON.stringify(filteredFiles));
    
    // Удаляем данные файла
    localStorage.removeItem(`file_data_${fileId}`);
    
    // Обновляем список
    loadFiles();
    
    showNotification('Файл удален', 'success');
}

// Копирование ссылки
function copyLink() {
    downloadLink.select();
    downloadLink.setSelectionRange(0, 99999); // Для мобильных устройств
    
    navigator.clipboard.writeText(downloadLink.value)
        .then(() => {
            showNotification('Ссылка скопирована в буфер обмена', 'success');
        })
        .catch(err => {
            console.error('Ошибка копирования: ', err);
            showNotification('Не удалось скопировать ссылку', 'error');
        });
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    // Добавляем на страницу
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Глобальные функции для вызова из HTML
window.clearFile = clearFile;
window.uploadFile = uploadFile;
window.copyLink = copyLink;
window.loadFiles = loadFiles;
window.downloadFile = downloadFile;
window.deleteFile = deleteFile;
