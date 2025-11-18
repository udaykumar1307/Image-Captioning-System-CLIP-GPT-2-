import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Upload, Sparkles, Download, Zap, Camera } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:5000';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [style, setStyle] = useState('creative');
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState(null);
  const [styles, setStyles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchStyles();
  }, []);

  const fetchStyles = async () => {
    try {
      const response = await axios.get(`${API_URL}/styles`);
      setStyles(response.data.styles);
    } catch (error) {
      console.error('Error fetching styles:', error);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setSelectedImage(file);
    setCaption(null);

    // Create image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateCaption = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      formData.append('style', style);

      const response = await axios.post(`${API_URL}/caption`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setCaption(response.data);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!caption) return;

    const data = {
      caption: caption.caption,
      confidence: caption.confidence,
      style: caption.style,
      image_info: caption.image_info,
      generated_at: new Date().toISOString(),
    };

    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = 'caption.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCaption(null);
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="header-icon">
            <Camera size={48} />
          </div>
          <h1>AI Image Captioning</h1>
          <p>CLIP + GPT-2 | Generate Natural Language Descriptions</p>
        </div>

        {/* Main Content */}
        <div className="content">
          {/* Upload Section */}
          <div className="upload-section">
            <h3>
              <Upload size={20} /> Upload Image
            </h3>

            <div
              className={`dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button className="change-image-btn" onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}>
                    Change Image
                  </button>
                </div>
              ) : (
                <div className="dropzone-content">
                  <ImageIcon size={48} />
                  <p>Drag and drop an image here</p>
                  <span>or click to browse</span>
                  <div className="supported-formats">
                    Supports: JPG, PNG, WebP, BMP
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="settings-section">
            <h3>
              <Zap size={20} /> Caption Style
            </h3>

            <div className="style-grid">
              {styles.map((s) => (
                <div
                  key={s.id}
                  className={`style-card ${style === s.id ? 'active' : ''}`}
                  onClick={() => setStyle(s.id)}
                >
                  <div className="style-name">{s.name}</div>
                  <div className="style-description">{s.description}</div>
                </div>
              ))}
            </div>

            <button
              className="generate-btn"
              onClick={handleGenerateCaption}
              disabled={!selectedImage || loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div> Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Generate Caption
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          {caption && (
            <div className="results-section">
              <div className="results-header">
                <h3>
                  <Sparkles size={20} /> Generated Caption
                </h3>
                <button onClick={handleDownload} className="download-btn">
                  <Download size={16} /> Download JSON
                </button>
              </div>

              <div className="caption-box">
                <p className="caption-text">{caption.caption}</p>
              </div>

              <div className="caption-stats">
                <div className="stat-item">
                  <span className="stat-label">Confidence</span>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${caption.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="stat-value">{(caption.confidence * 100).toFixed(1)}%</span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Style Used</span>
                  <span className="stat-value-badge">{caption.style}</span>
                </div>

                {caption.image_info && (
                  <div className="stat-item">
                    <span className="stat-label">Image Info</span>
                    <span className="stat-value">
                      {caption.image_info.width} × {caption.image_info.height} • {caption.image_info.format}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer">
          <p>Built with ❤️ by Uday Kumar | Powered by CLIP & GPT-2</p>
        </div>
      </div>
    </div>
  );
}

export default App;