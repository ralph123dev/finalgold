import { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle, Mic, Camera, Send, Play, Pause, X, ArrowLeft, Video, Image as ImageIcon } from 'lucide-react';
import { 
  listenToUsers, 
  sendPrivateMessage, 
  uploadFile,
  listenToPrivateMessages,
  markMessagesAsRead
} from '../utils/firebaseUtils';
import { getCountryFlag } from '../utils/countryUtils';

// Styles d'animation CSS
const styles = `
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.chat-slide-in {
  animation: slideIn 0.3s ease-out forwards;
}

.chat-slide-out {
  animation: slideOut 0.3s ease-out forwards;
}

.private-chat-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background: white;
}
`;

// Composant pour l'affichage audio style WhatsApp
const AudioMessage = ({ src, duration = 0, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center space-x-2 min-w-[200px] px-2">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isOwn ? 'bg-yellow-400 text-yellow-800 hover:bg-yellow-300' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="flex-1 flex flex-col">
        <div className={`h-1 rounded-full ${isOwn ? 'bg-yellow-300' : 'bg-gray-300'} relative`}>
          <div
            className={`h-1 rounded-full ${isOwn ? 'bg-yellow-100' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-xs mt-1 ${isOwn ? 'text-yellow-100' : 'text-gray-500'}`}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

// Composant pour la barre de progression d'upload
const UploadProgress = ({ progress, fileName }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <h3 className="text-lg font-bold mb-4">Envoi en cours...</h3>
      <p className="text-sm text-gray-600 mb-4 truncate">{fileName}</p>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">{progress}%</p>
    </div>
  </div>
);

// Composant pour la Popup de sélection de Média avec ouverture caméra native
const MediaPickerModal = ({ onClose, onFileSelect }) => {
  const galleryInputRef = useRef(null);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Créer un élément vidéo pour afficher le flux de la caméra
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Créer une interface pour prendre une photo ou vidéo
      const cameraContainer = document.createElement('div');
      cameraContainer.style.position = 'fixed';
      cameraContainer.style.top = '0';
      cameraContainer.style.left = '0';
      cameraContainer.style.width = '100%';
      cameraContainer.style.height = '100%';
      cameraContainer.style.backgroundColor = 'black';
      cameraContainer.style.zIndex = '1000';

      // Ajouter le vidéo au container
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      cameraContainer.appendChild(video);

      // Créer les boutons de contrôle
      const controls = document.createElement('div');
      controls.style.position = 'absolute';
      controls.style.bottom = '20px';
      controls.style.left = '0';
      controls.style.width = '100%';
      controls.style.display = 'flex';
      controls.style.justifyContent = 'center';
      controls.style.gap = '20px';

      // Bouton pour prendre une photo
      const capturePhotoBtn = document.createElement('button');
      capturePhotoBtn.innerHTML = '📷';
      capturePhotoBtn.style.fontSize = '24px';
      capturePhotoBtn.style.background = 'rgba(255,255,255,0.3)';
      capturePhotoBtn.style.borderRadius = '50%';
      capturePhotoBtn.style.width = '60px';
      capturePhotoBtn.style.height = '60px';
      capturePhotoBtn.style.border = 'none';

      // Bouton pour enregistrer une vidéo
      const recordVideoBtn = document.createElement('button');
      recordVideoBtn.innerHTML = '●';
      recordVideoBtn.style.fontSize = '24px';
      recordVideoBtn.style.background = 'red';
      recordVideoBtn.style.color = 'white';
      recordVideoBtn.style.borderRadius = '50%';
      recordVideoBtn.style.width = '60px';
      recordVideoBtn.style.height = '60px';
      recordVideoBtn.style.border = 'none';

      // Bouton pour fermer la caméra
      const closeCameraBtn = document.createElement('button');
      closeCameraBtn.innerHTML = '✕';
      closeCameraBtn.style.fontSize = '24px';
      closeCameraBtn.style.background = 'rgba(255,255,255,0.3)';
      closeCameraBtn.style.borderRadius = '50%';
      closeCameraBtn.style.width = '60px';
      closeCameraBtn.style.height = '60px';
      closeCameraBtn.style.border = 'none';
      closeCameraBtn.style.position = 'absolute';
      closeCameraBtn.style.top = '20px';
      closeCameraBtn.style.right = '20px';

      controls.appendChild(capturePhotoBtn);
      controls.appendChild(recordVideoBtn);
      cameraContainer.appendChild(controls);
      cameraContainer.appendChild(closeCameraBtn);

      // Ajouter le container à la page
      document.body.appendChild(cameraContainer);

      // Fonction pour nettoyer
      const cleanup = () => {
        stream.getTracks().forEach((track) => track.stop());
        document.body.removeChild(cameraContainer);
      };

      // Gestionnaires d'événements
      closeCameraBtn.onclick = () => {
        cleanup();
        onClose();
      };

      capturePhotoBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'photo.jpg', {
                type: 'image/jpeg',
              });
              onFileSelect(file);
              cleanup();
              onClose();
            }
          }, 'image/jpeg');
        }
      };

      let mediaRecorder = null;
      let recordedChunks = [];

      recordVideoBtn.onclick = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          // Arrêter l'enregistrement
          mediaRecorder.stop();
          recordVideoBtn.innerHTML = '●';
          recordVideoBtn.style.background = 'red';
        } else {
          // Commencer l'enregistrement
          recordedChunks = [];
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              recordedChunks.push(e.data);
            }
          };
          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const file = new File([blob], 'video.webm', { type: 'video/webm' });
            onFileSelect(file);
            cleanup();
            onClose();
          };
          mediaRecorder.start();
          recordVideoBtn.innerHTML = '■';
          recordVideoBtn.style.background = 'black';
        }
      };
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      alert('Impossible d accéder à la caméra. Vérifiez les permissions.');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 180) {
          alert('La vidéo ne doit pas dépasser 3 minutes.');
          if (event.target) event.target.value = '';
        } else {
          onFileSelect(file);
        }
      };
      video.src = URL.createObjectURL(file);
    } else {
      onFileSelect(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center relative animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full"
          aria-label="Fermer la fenêtre modale"
        >
          <X size={24} />
        </button>
        <h3 className="text-lg font-bold mb-6">Partager un média</h3>
        <div className="space-y-4">
          <button
            onClick={openCamera}
            className="w-full flex items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            type="button"
          >
            <Video className="mr-3 text-red-500" /> Prendre une photo ou une
            vidéo
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full flex items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            type="button"
          >
            <ImageIcon className="mr-3 text-blue-500" /> Choisir depuis la
            galerie
          </button>
        </div>
        {/* Input caché pour la galerie seulement */}
        <input
          type="file"
          accept="image/*,video/*"
          ref={galleryInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

// Composant principal pour la conversation privée
const PrivateChat = ({ currentUser, selectedUser, onBack, isVisible }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartTimeRef = useRef(0);
  const recordingIntervalRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Écouter les messages privés pour cette conversation spécifique
    const unsubscribe = listenToPrivateMessages(
      currentUser.pseudo, 
      selectedUser.pseudo, 
      (messages) => {
        setMessages(messages);
        
        // Marquer les messages comme lus
        markMessagesAsRead(currentUser.pseudo, selectedUser.pseudo);
      }
    );

    return unsubscribe;
  }, [currentUser.pseudo, selectedUser.pseudo]);

  useEffect(() => {
    // Faire défiler vers le bas quand de nouveaux messages arrivent
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Appliquer l'animation d'entrée lorsque le composant devient visible
    if (isVisible && chatContainerRef.current) {
      chatContainerRef.current.classList.remove('chat-slide-out');
      chatContainerRef.current.classList.add('chat-slide-in');
    }
  }, [isVisible]);

  const handleBackClick = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.classList.remove('chat-slide-in');
      chatContainerRef.current.classList.add('chat-slide-out');
      
      // Attendre la fin de l'animation avant d'appeler onBack
      setTimeout(() => {
        onBack();
      }, 300);
    } else {
      onBack();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRecordingTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendText = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await sendPrivateMessage(
        currentUser.pseudo, 
        selectedUser.pseudo, 
        'text', 
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('Erreur envoi message privé:', error);
      alert('Erreur lors de l\'envoi du message privé');
    }
  };

  const handleSendFile = async (file, kind) => {
    try {
      setUploadingFile(file.name);
      setUploadProgress(0);
      
      // Upload vers Cloudinary avec progression
      const mediaData = await uploadFile(file, kind, currentUser.pseudo, (progress) => {
        setUploadProgress(progress);
      });
      
      // Envoyer le message avec les données du média
      await sendPrivateMessage(
        currentUser.pseudo, 
        selectedUser.pseudo, 
        kind, 
        '', 
        mediaData
      );
    } catch (error) {
      console.error('Erreur envoi fichier privé:', error);
      alert('Erreur lors de l\'envoi du fichier privé');
    } finally {
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(
          Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
        );
      }, 1000);

      mediaRecorderRef.current.ondataavailable = (e) =>
        audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        setUploadingFile('Message vocal');
        setUploadProgress(0);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });

        try {
          // Upload du fichier audio
          const mediaData = await uploadFile(audioBlob, 'audio', currentUser.pseudo, (progress) => {
            setUploadProgress(progress);
          });
          
          // Envoyer le message audio
          await sendPrivateMessage(
            currentUser.pseudo,
            selectedUser.pseudo,
            'audio',
            '',
            {...mediaData, duration: recordingDuration}
          );
        } catch (error) {
          console.error('Erreur envoi message vocal:', error);
          alert("L'envoi du message vocal a échoué.");
        } finally {
          setUploadingFile(null);
          setUploadProgress(0);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erreur accès micro:', error);
      alert('Impossible d accéder au microphone. Vérifiez les permissions.');
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const renderMessageContent = (message) => {
    const isOwn = message.from === currentUser.pseudo;

    switch (message.type) {
      case 'text':
        return <p className="text-sm break-words px-2">{message.text}</p>;
      case 'image':
        return (
          <img 
            src={message.mediaUrl} 
            alt={message.mediaInfo?.fileName || "Image partagée"} 
            className="max-w-full rounded" 
            loading="lazy"
          />
        );
      case 'audio':
        return (
          <AudioMessage 
            src={message.mediaUrl} 
            duration={message.mediaInfo?.duration || 0} 
            isOwn={isOwn}
          />
        );
      case 'video':
        return (
          <video 
            controls 
            src={message.mediaUrl} 
            className="max-w-full rounded"
            preload="metadata"
          />
        );
      case 'document':
        return (
          <div className="flex items-center">
            <a 
              href={message.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center"
            >
              <span className="mr-2">📄</span>
              {message.mediaInfo?.fileName || 'Document'}
            </a>
          </div>
        );
      default:
        return <p className="text-sm break-words px-2 text-red-400 italic">[Message illisible]</p>;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{styles}</style>
      <div ref={chatContainerRef} className="private-chat-container">
        <div
          className="flex flex-col h-full bg-transparent"
          style={{
            backgroundImage: "url(/bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="flex-shrink-0 flex items-center p-4 border-b border-gray-200/50 bg-white/10 backdrop-blur-sm">
            <button
              onClick={handleBackClick}
              className="mr-3 p-2 rounded-full hover:bg-yellow-100/50 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={24} className="text-yellow-600" />
            </button>
            <MessageCircle className="text-yellow-600 mr-2" size={24} />
            <h2 className="text-lg font-bold text-yellow-700">Conversation avec {selectedUser.pseudo}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Aucun message pour le moment</p>
                <p className="text-gray-400 text-sm">
                  Commencez la conversation avec {selectedUser.pseudo} !
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.from === currentUser.pseudo;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md p-2 rounded-lg shadow-md ${
                        isOwn
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                          : 'bg-white border text-gray-800'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-semibold mb-1 text-yellow-600 px-2">
                          {message.from}
                        </p>
                      )}

                      <div className="p-1">{renderMessageContent(message)}</div>

                      <p
                        className={`text-xs text-right mt-1 px-2 ${
                          isOwn ? 'text-yellow-100' : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp ? formatTime(message.timestamp.toDate()) : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 p-4 border-t border-gray-200/50 bg-white/10 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  isRecording
                    ? `Enregistrement... ${formatRecordingTime(recordingDuration)}`
                    : 'Entrez votre message...'
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                disabled={loading || isRecording}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendText();
                }}
              />

              {newMessage.trim() ? (
                <button
                  onClick={handleSendText}
                  disabled={loading}
                  className="p-3 rounded-full bg-yellow-600 text-white transition-transform hover:scale-110 disabled:opacity-50"
                  aria-label="Envoyer message"
                >
                  <Send size={20} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsMediaModalOpen(true)}
                    disabled={loading || isRecording}
                    className="p-3 rounded-full text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                    aria-label="Ajouter média"
                  >
                    <Camera size={20} />
                  </button>
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={loading}
                    className={`p-3 rounded-full text-white disabled:opacity-50 transition-all ${
                      isRecording
                        ? 'bg-red-500 animate-pulse scale-110'
                        : 'bg-yellow-600 hover:scale-110'
                    }`}
                    aria-label={
                      isRecording
                        ? 'Arrêter enregistrement'
                        : 'Commencer enregistrement vocal'
                    }
                  >
                    <Mic size={20} />
                  </button>
                </>
              )}
            </div>

            {loading && !uploadingFile && (
              <div className="mt-2 text-center text-sm text-gray-600">
                Envoi en cours...
              </div>
            )}
          </div>
        </div>

        {isMediaModalOpen && (
          <MediaPickerModal
            onClose={() => setIsMediaModalOpen(false)}
            onFileSelect={(file) => {
              const kind = file.type.startsWith('image/') ? 'image' : 
                          file.type.startsWith('video/') ? 'video' : 
                          file.type.startsWith('audio/') ? 'audio' : 'document';
              handleSendFile(file, kind);
            }}
          />
        )}
        {uploadingFile && (
          <UploadProgress progress={uploadProgress} fileName={uploadingFile} />
        )}
      </div>
    </>
  );
};

const Channel = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToUsers((snapshot) => {
      const usersList = [];
      snapshot.forEach((doc) => {
        if (doc.exists() && doc.id !== currentUser.pseudo) {
          usersList.push({ id: doc.id, ...doc.data() });
        }
      });
      setUsers(usersList);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser.pseudo]);

  // Écouter les messages privés pour les notifications
  useEffect(() => {
    const unsubscribe = listenToPrivateMessages(currentUser.pseudo, null, (messages) => {
      const counts = {};
      
      // Compter les messages non lus pour chaque utilisateur
      messages.forEach(msg => {
        if (msg.to === currentUser.pseudo && !msg.read) {
          counts[msg.from] = (counts[msg.from] || 0) + 1;
        }
      });
      
      setUnreadCounts(counts);
    });

    return unsubscribe;
  }, [currentUser.pseudo]);

  // Fonction pour formater la date et l'heure
  const formatConnectionTime = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} h`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowChat(true);
  };

  const handleBackFromChat = () => {
    setShowChat(false);
    setTimeout(() => {
      setSelectedUser(null);
    }, 300); // Attendre la fin de l'animation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative">
      <style>{styles}</style>
      
      {/* Liste des utilisateurs */}
      <div className={`p-4 transition-opacity duration-300 ${showChat ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center mb-6">
          <Users className="text-yellow-600 mr-2" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Global Chat</h2>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">Aucun utilisateur connecté pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className={`bg-white rounded-lg p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer ${
                  selectedUser?.id === user.id ? 'ring-2 ring-yellow-400' : ''
                }`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.pseudo.charAt(0).toUpperCase()}
                      </div>
                      {unreadCounts[user.pseudo] > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCounts[user.pseudo]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{user.pseudo}</p>
                      <div className="flex items-center mt-1">
                        <p className="text-sm text-gray-600 mr-2">En ligne</p>
                        {/* Afficher le drapeau du pays */}
                        {user.countryCode && (
                          <img 
                            src={getCountryFlag(user.countryCode)} 
                            alt={user.countryCode} 
                            className="w-4 h-4 rounded-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {user.connectionTime ? formatConnectionTime(user.connectionTime) : 'Connecté récemment'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat privé */}
      {selectedUser && (
        <PrivateChat 
          currentUser={currentUser} 
          selectedUser={selectedUser} 
          onBack={handleBackFromChat}
          isVisible={showChat}
        />
      )}
    </div>
  );
};

export default Channel;
