import { useState, useRef } from 'react';

const MessageInput = ({ onSendText, onSendFile }) => {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSendText(text);
      setText('');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Déterminer le type de fichier
      let fileType;
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      } else {
        alert('Type de fichier non supporté');
        setIsUploading(false);
        return;
      }

      await onSendFile(file, fileType);
      
      // Réinitialiser l'input fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du fichier:', error);
      alert('Erreur lors de l\'envoi du fichier');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="message-input">
      <form onSubmit={handleTextSubmit} className="text-input-form">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message..."
          disabled={isUploading}
        />
        <button type="submit" disabled={!text.trim() || isUploading}>
          Envoyer
        </button>
      </form>
      
      <div className="file-input-section">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,audio/*,video/*"
          style={{ display: 'none' }}
          disabled={isUploading}
        />
        <button 
          onClick={triggerFileInput} 
          disabled={isUploading}
          className="file-button"
        >
          Ajouter un média
        </button>
        
        {isUploading && <div className="upload-indicator">Envoi en cours...</div>}
      </div>
    </div>
  );
};

export default MessageInput;