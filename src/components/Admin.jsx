import React, { useState, useEffect } from 'react';
import { Shield, Trash2, MessageCircle, Crown, Image, Music, FileText, Play, Pause } from 'lucide-react';
import { subscribeToMessages, deleteMessage, getMessageStats } from '../utils/firebaseUtils';

const Admin = ({ onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages((fetchedMessages) => {
      setMessages(fetchedMessages);
    });

    // Charger les statistiques
    loadStats();

    return () => unsubscribe();
  }, []);

  const loadStats = async () => {
    try {
      const messageStats = await getMessageStats();
      setStats(messageStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message définitivement ?')) {
      setLoading(true);
      try {
        await deleteMessage(messageId);
        // Recharger les statistiques après suppression
        loadStats();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du message.');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatAudioDuration = (duration) => {
    if (!duration) return '0:00';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayAudio = (messageId, audioUrl) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(messageId);
      // Créer et jouer l'audio
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setPlayingAudio(null);
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4 text-green-500" />;
      case 'audio':
        return <Music className="w-4 h-4 text-purple-500" />;
      case 'file':
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const renderMessageContent = (message) => {
    const { type, content, mediaUrl, audioDuration } = message;

    switch (type) {
      case 'image':
        return (
          <div className="space-y-2">
            {content && (
              <p className="text-gray-700 text-sm sm:text-base break-words">{content}</p>
            )}
            <div className="relative">
              <img 
                src={mediaUrl} 
                alt="Image partagée"
                className="max-w-full h-auto max-h-48 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.open(mediaUrl, '_blank')}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                Image
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-2">
            {content && (
              <p className="text-gray-700 text-sm sm:text-base break-words">{content}</p>
            )}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center space-x-3">
              <button
                onClick={() => handlePlayAudio(message.id, mediaUrl)}
                className="flex-shrink-0 w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                {playingAudio === message.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 font-medium text-sm">Message audio</span>
                  <span className="text-purple-600 text-xs">
                    {formatAudioDuration(audioDuration)}
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-1.5 mt-1">
                  <div className="bg-purple-500 h-1.5 rounded-full w-0"></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            {content && (
              <p className="text-gray-700 text-sm sm:text-base break-words">{content}</p>
            )}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-orange-700 font-medium text-sm truncate">
                    Fichier partagé
                  </p>
                  <a 
                    href={mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-800 text-xs underline"
                  >
                    Télécharger
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-gray-700 text-sm sm:text-base break-words">
            {content || 'Message sans contenu'}
          </p>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-red-200 p-2 sm:p-4 lg:p-6">
      <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg sm:shadow-xl lg:shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Crown size={24} className="sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Administration</h1>
                  <p className="text-red-100 text-xs sm:text-sm lg:text-base">Gold Connect - Panel Admin</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition-colors w-full sm:w-auto"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Statistiques */}
          {stats && (
            <div className="bg-red-50 border-b border-red-100 p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-lg sm:text-xl font-bold text-red-600">{stats.totalMessages}</div>
                  <div className="text-xs sm:text-sm text-red-500">Messages</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-green-600">{stats.messagesByType?.image || 0}</div>
                  <div className="text-xs sm:text-sm text-green-500">Images</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-purple-600">{stats.messagesByType?.audio || 0}</div>
                  <div className="text-xs sm:text-sm text-purple-500">Audios</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-orange-600">{stats.messagesByType?.file || 0}</div>
                  <div className="text-xs sm:text-sm text-orange-500">Fichiers</div>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center">
                <MessageCircle className="text-red-600 mr-2 w-5 h-5 sm:w-6 sm:h-6" />
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                  Conversations ({messages.length})
                </h2>
              </div>
              {loading && (
                <div className="text-sm text-gray-500 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                  Suppression...
                </div>
              )}
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-8 sm:py-10 lg:py-12">
                <MessageCircle className="mx-auto text-gray-400 mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12" />
                <p className="text-gray-500 text-sm sm:text-base">Aucun message à afficher</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* En-tête du message */}
                    <div className="bg-white border-b border-gray-200 p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {message.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                {message.userName}
                              </p>
                              {getMessageIcon(message.type)}
                            </div>
                            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                              <span className="truncate">{message.country || 'Pays non spécifié'}</span>
                              <span>•</span>
                              <span>{formatDateTime(message.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          disabled={loading}
                          className="ml-2 text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0"
                          title="Supprimer ce message"
                        >
                          <Trash2 size={18} className="sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Contenu du message */}
                    <div className="p-3 sm:p-4">
                      {renderMessageContent(message)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;