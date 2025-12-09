import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, send_file, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from config import Config
import uuid

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)

# Создаем папку для загрузок если её нет
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Модель для хранения информации о файлах
class File(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    file_size = db.Column(db.Integer, nullable=False)
    download_count = db.Column(db.Integer, default=0)
    password = db.Column(db.String(128))  # Опциональный пароль для доступа

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Генерируем уникальное имя файла
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}" if file_extension else uuid.uuid4().hex
        
        # Получаем пароль если есть
        password = request.form.get('password')
        
        # Сохраняем файл
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # Сохраняем информацию в БД
        new_file = File(
            id=unique_filename.split('.')[0],
            filename=unique_filename,
            original_filename=original_filename,
            file_size=os.path.getsize(file_path),
            password=password
        )
        
        db.session.add(new_file)
        db.session.commit()
        
        # Генерируем ссылку для скачивания
        download_url = url_for('download_page', file_id=new_file.id, _external=True)
        
        return jsonify({
            'success': True,
            'download_url': download_url,
            'file_id': new_file.id,
            'original_filename': original_filename,
            'file_size': new_file.file_size
        })
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/d/<file_id>')
def download_page(file_id):
    file_record = File.query.get_or_404(file_id)
    return render_template('download.html', file=file_record)

@app.route('/download/<file_id>', methods=['POST'])
def download_file(file_id):
    file_record = File.query.get_or_404(file_id)
    
    # Проверка пароля если установлен
    password = request.form.get('password')
    if file_record.password and file_record.password != password:
        return jsonify({'error': 'Invalid password'}), 403
    
    # Увеличиваем счетчик скачиваний
    file_record.download_count += 1
    db.session.commit()
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_record.filename)
    
    # Если это AJAX запрос, возвращаем JSON
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({
            'success': True,
            'url': url_for('send_file', file_id=file_id, _external=True)
        })
    
    # Иначе редиректим на скачивание
    return redirect(url_for('send_file', file_id=file_id))

@app.route('/send/<file_id>')
def send_file(file_id):
    file_record = File.query.get_or_404(file_id)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_record.filename)
    return send_file(
        file_path,
        as_attachment=True,
        download_name=file_record.original_filename
    )

@app.route('/api/files')
def list_files():
    files = File.query.order_by(File.upload_date.desc()).all()
    result = []
    for file in files:
        result.append({
            'id': file.id,
            'original_filename': file.original_filename,
            'upload_date': file.upload_date.isoformat(),
            'file_size': file.file_size,
            'download_count': file.download_count,
            'download_url': url_for('download_page', file_id=file.id, _external=True)
        })
    return jsonify(result)

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large'}), 413

@app.errorhandler(404)
def not_found(e):
    return render_template('index.html'), 404

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
