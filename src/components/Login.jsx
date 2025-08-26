import { useState } from 'react';
import { LogIn, X } from 'lucide-react';
import { createUserIfNeeded } from '../utils/firebaseUtils';
import { getUserCountryInfo } from '../utils/countryUtils';
import './Login.css';

const TermsModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
      <div className="flex justify-between items-center p-5 border-b border-gray-200">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Terms and Conditions</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
          aria-label="Fermer la fenêtre modale"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-4 md:p-6 overflow-y-auto space-y-4">
        <h3 className="font-semibold text-gray-700 text-base md:text-lg">1. Acceptance of Terms</h3>
        <p className="text-gray-600 text-xs md:text-sm">
          By accessing and using Gold Connect (the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of the terms, you may not access the Service.
        </p>

        <h3 className="font-semibold text-gray-700 text-base md:text-lg">2. Use of Service</h3>
        <p className="text-gray-600 text-xs md:text-sm">
          You agree to use the Service only for lawful purposes and in a way that does not infringe the rights of others, nor restrict or inhibit anyone else's use and enjoyment of the Service. Prohibited behaviors include harassment, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within the Service.
        </p>

        <h3 className="font-semibold text-gray-700 text-base md:text-lg">3. Data Privacy</h3>
        <p className="text-gray-600 text-xs md:text-sm">
          Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using our Service, you agree to the collection and use of information in accordance with our Privacy Policy.
        </p>

        <h3 className="font-semibold text-gray-700 text-base md:text-lg">4. Limitation of Liability</h3>
        <p className="text-gray-600 text-xs md:text-sm">
          The Service is provided "as is". Gold Connect does not warrant that the service will be uninterrupted, secure, or error-free. In no event shall Gold Connect be liable for any indirect, incidental, special, consequential, or punitive damages.
        </p>

        <h3 className="font-semibold text-gray-700 text-base md:text-lg">5. User Conduct</h3>
        <p className="text-gray-600 text-xs md:text-sm">
          You are solely responsible for all content that you upload, post, email or otherwise transmit via the Service. You agree not to use the Service to:
          <br />- Harm minors in any way;
          <br />- Impersonate any person or entity;
          <br />- Forge headers or otherwise manipulate identifiers to disguise the origin of any content;
          <br />- Interfere with or disrupt the Service or servers;
          <br />- Intentionally or unintentionally violate any applicable local, state, national or international law.
        </p>

        <h3 className="font-semibold text-gray-700 text-base md:text-lg">6. Account Security</h3>
        <p className="text-gray-600 text-xs md:text-sm">
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.
        </p>

        <h3 className="font-semibold text-gray-700 text-base md:text-lg">7. Modifications to Service</h3>
        <p className="text-gray-600 text-xs md:text-sm">
          We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. You agree that we shall not be liable to you or to any third party for any modification, suspension or discontinuance of the Service.
        </p>

        <h3 className="font-semibold text-gray-700 text-base md:text-lg">8. Governing Law</h3>
        <p className="text-gray-600 text-xs md:text-sm">
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which our company is established, without regard to its conflict of law provisions.
        </p>
      </div>

      <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <button
          onClick={onClose}
          className="bg-yellow-600 text-white py-2 px-5 rounded-lg font-medium hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all text-sm md:text-base"
        >
          I understand
        </button>
      </div>
    </div>
  </div>
);

const Login = ({ setUser }) => {
  const [pseudo, setPseudo] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flowers, setFlowers] = useState([]);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const handlePseudoChange = (e) => {
    const newPseudo = e.target.value;
    if (newPseudo.length > pseudo.length) {
      createFlower();
    }
    setPseudo(newPseudo);
  };

  const createFlower = () => {
    const newFlower = {
      id: Date.now() + Math.random(),
      style: {
        top: `${Math.random() * 60 - 20}%`,
        left: `${Math.random() * 100}%`,
      },
    };
    setFlowers((currentFlowers) => [...currentFlowers, newFlower]);
    setTimeout(() => {
      setFlowers((currentFlowers) =>
        currentFlowers.filter((f) => f.id !== newFlower.id)
      );
    }, 1500);
  };

  const handleLogin = async () => {
    if (!pseudo.trim()) {
      setError('Enter your username');
      return;
    }
    
    if (!acceptTerms) {
      setError('Accept the terms and conditions to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Récupérer les informations de pays de l'utilisateur
      const countryInfo = await getUserCountryInfo();
      
      // Créer l'utilisateur avec les informations de pays
      await createUserIfNeeded(pseudo, countryInfo);
      setUser({ 
        pseudo, 
        countryCode: countryInfo.country_code,
        country: countryInfo.country 
      });
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${isTermsModalOpen ? 'blur-sm' : ''}`}
        style={{
          backgroundImage: 'url(/accueil.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md">
          <div className="text-center mb-6 md:mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/logo.png" alt="Logo" className="h-10 md:h-12 mr-2" />
              <h1 className="text-2xl md:text-3xl font-bold text-yellow-600">Gold Connect</h1>
            </div>
            <p className="text-gray-600 text-sm md:text-base">Sign in to your golden network</p>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="name-input-container">
              <label htmlFor="pseudo" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Your name
              </label>
              <input
                type="text"
                id="pseudo"
                value={pseudo}
                onChange={handlePseudoChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm md:text-base"
                placeholder="Enter your name"
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              {flowers.map((flower) => (
                <span key={flower.id} className="flower" style={flower.style}>
                  🌸
                </span>
              ))}
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                disabled={loading}
              />
              <label htmlFor="terms" className="text-xs md:text-sm text-gray-700">
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  className="font-medium text-yellow-600 underline hover:text-yellow-700 focus:outline-none"
                >
                  terms and conditions
                </button>
                {' '}of Goldin.
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-red-600 text-xs md:text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover:from-yellow-600 hover:to-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn size={18} className="md:size-5" />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {isTermsModalOpen && <TermsModal onClose={() => setIsTermsModalOpen(false)} />}
    </>
  );
};

export default Login;