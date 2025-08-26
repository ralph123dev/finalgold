import { useState, useEffect } from 'react';
import { ArrowLeft, Users, MessageCircle, Shield } from 'lucide-react';
import Login from './components/Login';
import Channel from './components/Channel';
import ChatGroup from './components/ChatGroup';
import Verify from './components/Verify';
import { purgeAllAppData } from './utils/firebaseUtils';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('channel');

  useEffect(() => {
    const setupPurge = async () => {
      try {
        const lastPurge = localStorage.getItem('goldin:lastPurge');
        const now = Date.now();
        if (!lastPurge || now - parseInt(lastPurge) > 2 * 60 * 60 * 1000) {
          await purgeAllAppData();
          localStorage.setItem('goldin:lastPurge', now.toString());
        }
        setInterval(async () => {
          await purgeAllAppData();
          localStorage.setItem('goldin:lastPurge', Date.now().toString());
        }, 2 * 60 * 60 * 1000);
      } catch (error) {
        console.error('Erreur lors de la configuration de la purge:', error);
      }
    };
    setupPurge();
  }, []);

  const handleLogout = () => {
    setUser(null);
    // Supprimer les données utilisateur stockées si nécessaire
    if (window.goldConnectUser) {
      delete window.goldConnectUser;
    }
  };

  const tabs = [
    { id: 'channel', name: 'Channel', icon: Users },
    { id: 'chat', name: 'Chat', icon: MessageCircle },
    { id: 'verify', name: 'Verify', icon: Shield },
  ];

  if (!user) return <Login setUser={setUser} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      <div className="bg-white shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-yellow-600">Gold Connect</h1>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user.pseudo.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="flex border-t border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-yellow-50 text-yellow-600 border-b-2 border-yellow-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} className="mb-1" />
                <span className="text-xs font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-md mx-auto bg-white min-h-[calc(100vh-140px)] shadow-lg">
        {activeTab === 'channel' && <Channel currentUser={user} />}
        {activeTab === 'chat' && <ChatGroup currentUser={user} />}
        {activeTab === 'verify' && <Verify currentUser={user} />}
      </div>
    </div>
  );
}

export default App;