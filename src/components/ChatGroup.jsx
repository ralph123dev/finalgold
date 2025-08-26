import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Mic, Camera, X, Video, Image as ImageIcon, Play, Pause } from 'lucide-react';

// Import des services - adaptés pour JavaScript
import { 
  listenToGroupMessages,
  sendGroupMessage,
  uploadFile 
} from '../utils/firebaseUtils';

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
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center space-x-2 min-w-[200px] px-2">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => {
          if (audioRef.current && !duration) setCurrentTime(0);
        }}
      />
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isOwn
            ? "bg-yellow-400 text-yellow-800 hover:bg-yellow-300"
            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
        }`}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="flex-1 flex flex-col">
        <div
          className={`h-1 rounded-full ${
            isOwn ? "bg-yellow-300" : "bg-gray-300"
          } relative`}
        >
          <div
            className={`h-1 rounded-full ${
              isOwn ? "bg-yellow-100" : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span
          className={`text-xs mt-1 ${
            isOwn ? "text-yellow-100" : "text-gray-500"
          }`}
        >
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

// --- Composant pour la Popup de sélection de Média ---
const MediaPickerModal = ({ onClose, onFileSelect }) => {
  const galleryInputRef = useRef(null);
  const [cameraMode, setCameraMode] = useState(null);

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

  const openCamera = async (facingMode) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });

      // Créer un élément vidéo pour afficher le flux de la caméra
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      // Créer une interface pour prendre une photo ou vidéo
      const cameraContainer = document.createElement("div");
      cameraContainer.style.position = "fixed";
      cameraContainer.style.top = "0";
      cameraContainer.style.left = "0";
      cameraContainer.style.width = "100%";
      cameraContainer.style.height = "100%";
      cameraContainer.style.backgroundColor = "black";
      cameraContainer.style.zIndex = "1000";

      // Ajouter le vidéo au container
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      cameraContainer.appendChild(video);

      // Créer les boutons de contrôle
      const controls = document.createElement("div");
      controls.style.position = "absolute";
      controls.style.bottom = "20px";
      controls.style.left = "0";
      controls.style.width = "100%";
      controls.style.display = "flex";
      controls.style.justifyContent = "center";
      controls.style.gap = "20px";

      // Bouton pour prendre une photo
      const capturePhotoBtn = document.createElement("button");
      capturePhotoBtn.innerHTML = "📷";
      capturePhotoBtn.style.fontSize = "24px";
      capturePhotoBtn.style.background = "rgba(255,255,255,0.3)";
      capturePhotoBtn.style.borderRadius = "50%";
      capturePhotoBtn.style.width = "60px";
      capturePhotoBtn.style.height = "60px";
      capturePhotoBtn.style.border = "none";

      // Bouton pour enregistrer une vidéo
      const recordVideoBtn = document.createElement("button");
      recordVideoBtn.innerHTML = "●";
      recordVideoBtn.style.fontSize = "24px";
      recordVideoBtn.style.background = "red";
      recordVideoBtn.style.color = "white";
      recordVideoBtn.style.borderRadius = "50%";
      recordVideoBtn.style.width = "60px";
      recordVideoBtn.style.height = "60px";
      recordVideoBtn.style.border = "none";

      // Bouton pour fermer la caméra
      const closeCameraBtn = document.createElement("button");
      closeCameraBtn.innerHTML = "✕";
      closeCameraBtn.style.fontSize = "24px";
      closeCameraBtn.style.background = "rgba(255,255,255,0.3)";
      closeCameraBtn.style.borderRadius = "50%";
      closeCameraBtn.style.width = "60px";
      closeCameraBtn.style.height = "60px";
      closeCameraBtn.style.border = "none";
      closeCameraBtn.style.position = "absolute";
      closeCameraBtn.style.top = "20px";
      closeCameraBtn.style.right = "20px";

      controls.appendChild(capturePhotoBtn);
      controls.appendChild(recordVideoBtn);
      cameraContainer.appendChild(controls);
      cameraContainer.appendChild(closeCameraBtn);

      // Ajouter le container à la page
      document.body.appendChild(cameraContainer);

      // =================================================================
      // DÉBUT DE LA MODIFICATION
      // =================================================================
      // Fonction pour nettoyer
      const cleanup = () => {
        stream.getTracks().forEach((track) => track.stop());
        // On vérifie si cameraContainer est toujours un enfant de document.body avant de le supprimer
        if (document.body.contains(cameraContainer)) {
          document.body.removeChild(cameraContainer);
        }
      };
      // =================================================================
      // FIN DE LA MODIFICATION
      // =================================================================

      // Gestionnaires d'événements
      closeCameraBtn.onclick = () => {
        cleanup();
        onClose();
      };

      capturePhotoBtn.onclick = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], "photo.jpg", {
                type: "image/jpeg",
              });
              onFileSelect(file);
              cleanup();
              onClose();
            }
          }, "image/jpeg");
        }
      };

      let mediaRecorder = null;
      let recordedChunks = [];

      recordVideoBtn.onclick = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
          // Arrêter l'enregistrement
          mediaRecorder.stop();
          recordVideoBtn.innerHTML = "●";
          recordVideoBtn.style.background = "red";
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
            const blob = new Blob(recordedChunks, { type: "video/webm" });
            const file = new File([blob], "video.webm", { type: "video/webm" });
            onFileSelect(file);
            cleanup();
            onClose();
          };
          mediaRecorder.start();
          recordVideoBtn.innerHTML = "■";
          recordVideoBtn.style.background = "black";
        }
      };
    } catch (error) {
      console.error("Erreur accès caméra:", error);
      alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setCameraMode(null); // Reset camera mode on error
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full"
        >
          <X size={24} />
        </button>
        
        {cameraMode === null ? (
          <>
            <h3 className="text-lg font-bold mb-6">Partager un média</h3>
            <div className="space-y-4">
               <button
                onClick={() => {
                  setCameraMode('user');
                  openCamera('user'); // Caméra avant
                }}
                className="w-full flex items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Video className="mr-3 text-red-500" /> Prendre une photo ou une vidéo
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ImageIcon className="mr-3 text-blue-500" /> Choisir depuis la galerie
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold mb-6">Choisir une caméra</h3>
            <div className="space-y-4">
              <button
                onClick={() => openCamera(cameraMode)}
                className="w-full flex items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Video className="mr-3 text-blue-500" /> Caméra avant
              </button>
              <button
                onClick={() => {
                  setCameraMode('environment');
                  openCamera('environment'); // Caméra arrière
                }}
                className="w-full flex items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Video className="mr-3 text-green-500" /> Caméra arrière
              </button>
            </div>
          </>
        )}

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


// --- Composant Principal du ChatGroup ---
const ChatGroup = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [userCountry, setUserCountry] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartTimeRef = useRef(0);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    // Récupération des informations pays
    const fetchUserCountry = async () => {
      try {
        // Simuler la récupération du pays
        setUserCountry(currentUser?.country || 'Inconnu');
      } catch (error) {
        console.error("Impossible de récupérer le pays de l'utilisateur", error);
        setUserCountry('Inconnu');
      }
    };
    
    fetchUserCountry();

    // Écoute des messages
    const unsubscribe = listenToGroupMessages((snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({ 
          id: doc.id, 
          ...data,
          userName: data.from || data.userName,
          content: data.text || data.content,
          type: data.type || 'text',
          fileURL: data.mediaUrl || data.fileURL,
          timestamp: data.timestamp || new Date(),
          country: userCountry,
          audioDuration: data.audioDuration || 0
        });
      });
      setMessages(msgs);
    });

    return unsubscribe;
  }, [currentUser, userCountry]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRecordingTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Fonction pour mettre à jour la progression de l'upload
  const handleUploadProgress = (progress) => {
    setUploadProgress(progress);
  };

  // Envoi de message texte
  const handleSendTextMessage = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      await sendGroupMessage(currentUser.pseudo, 'text', newMessage.trim(), null, userCountry);
      setNewMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message texte:', error);
    } finally {
      setLoading(false);
    }
  };

  // Envoi de fichier
  const handleSendFile = async (file) => {
    setIsMediaModalOpen(false);
    setUploadingFile(file.name);
    setUploadProgress(0);
    setLoading(true);

    try {
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'document';
      
      const fileURL = await uploadFile(file, fileType, currentUser.pseudo, handleUploadProgress);
      
      await sendGroupMessage(currentUser.pseudo, fileType, '', fileURL, userCountry);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du fichier:', error);
      alert("L'envoi du fichier a échoué.");
    } finally {
      setUploadingFile(null);
      setUploadProgress(0);
      setLoading(false);
    }
  };

  // Enregistrement audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
      }, 1000);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        setUploadingFile("Message vocal");
        setUploadProgress(0);
        setLoading(true);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const fileURL = await uploadFile(audioBlob, 'audio', currentUser.pseudo, handleUploadProgress);
          await sendGroupMessage(currentUser.pseudo, 'audio', '', fileURL, userCountry, recordingDuration);
        } catch (error) {
          console.error("Erreur lors de l'envoi du message vocal:", error);
          alert("L'envoi du message vocal a échoué.");
        } finally {
          setUploadingFile(null);
          setUploadProgress(0);
          setLoading(false);
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erreur d'accès au microphone:", error);
      alert("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Rendu du contenu des messages
  const renderMessageContent = (message) => {
    const isOwn = message.userName === currentUser.pseudo;

    switch (message.type) {
      case 'image':
        if (message.fileURL) {
          return (
            <img 
              src={message.fileURL} 
              alt="Image envoyée" 
              className="rounded-lg max-w-full h-auto" 
            />
          );
        }
        break;
      case 'video':
        if (message.fileURL) {
          return (
            <video 
              src={message.fileURL} 
              controls 
              className="rounded-lg max-w-full h-auto" 
            />
          );
        }
        break;
      case 'audio':
        if (message.fileURL) {
          return (
            <AudioMessage
              src={message.fileURL}
              duration={message.audioDuration || 0}
              isOwn={isOwn}
            />
          );
        }
        break;
      case 'text':
        if (message.content) {
          return (
            <p className="text-sm break-words px-2">
              {message.content}
            </p>
          );
        }
        break;
    }
    return <p className="text-sm break-words px-2 text-red-400 italic">[Message illisible]</p>;
  };

  return (
    <>
      <div 
        className="flex flex-col h-screen bg-transparent" 
        style={{ 
          backgroundImage: 'url(/bg.png)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundAttachment: 'fixed' 
        }}
      >
        <div className="flex-shrink-0 flex items-center p-4 border-b border-gray-200/50 bg-white/10 backdrop-blur-sm">
          <MessageCircle className="text-yellow-600 mr-2" size={24} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-gray-400 text-sm">Be the first to write!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.userName === currentUser.pseudo ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs lg:max-w-md p-2 rounded-lg shadow-md ${
                    message.userName === currentUser.pseudo 
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' 
                      : 'bg-white border text-gray-800'
                  }`}
                >
                  
                  {message.userName !== currentUser.pseudo && (
                    <p className="text-xs font-semibold mb-1 text-yellow-600 px-2">
                      {message.userName || 'Utilisateur Inconnu'}
                      {message.country && ` • ${message.country}`}
                    </p>
                  )}
                  
                  <div className="p-1">{renderMessageContent(message)}</div>

                  <p 
                    className={`text-xs text-right mt-1 px-2 ${
                      message.userName === currentUser.pseudo 
                        ? 'text-yellow-100' 
                        : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-200/50 bg-white/10 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isRecording ? `Enregistrement... ${formatRecordingTime(recordingDuration)}` : "Entrez votre message..."}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              disabled={loading || isRecording}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendTextMessage();
                }
              }}
            />
            
            {newMessage.trim() ? (
              <button 
                onClick={handleSendTextMessage} 
                disabled={loading} 
                className="p-3 rounded-full bg-yellow-600 text-white transition-transform hover:scale-110 disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setIsMediaModalOpen(true)} 
                  disabled={loading || isRecording} 
                  className="p-3 rounded-full text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                >
                  <Camera size={20} />
                </button>
                <button 
                  onClick={isRecording ? stopRecording : startRecording} 
                  disabled={loading} 
                  className={`p-3 rounded-full text-white disabled:opacity-50 transition-all ${
                    isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-yellow-600 hover:scale-110'
                  }`}
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
          onFileSelect={handleSendFile} 
        />
      )}
      
      {uploadingFile && (
        <UploadProgress progress={uploadProgress} fileName={uploadingFile} />
      )}
    </>
  );
};

export default ChatGroup;