import React, { useState } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import LoginHeader from '../login/components/LoginHeader';
import LanguageSelector from '../login/components/LanguageSelector';
import ThemeToggle from '../login/components/ThemeToggle';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleInputChange = (e) => {
    setEmail(e?.target?.value || '');
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex?.test(email);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!email) {
      setError('L\'adresse email est requise');
      return;
    }

    if (!validateEmail(email)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    if (cooldown > 0) {
      setError(`Veuillez attendre ${cooldown} secondes avant de renvoyer`);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase?.auth?.resetPasswordForEmail(email, {
        redirectTo: `${window.location?.origin}/update-password`
      });

      if (error) {
        setError(error?.message || 'Erreur lors de l\'envoi de l\'email');
      } else {
        setSuccess('Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception et vos spams.');
        setEmail('');
        
        // Start cooldown (60 seconds)
        setCooldown(60);
        const interval = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldown === 0) {
      handleSubmit({ preventDefault: () => {} });
    }
  };

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header Component */}
        <LoginHeader currentLanguage={currentLanguage} />
        
        {/* Language and Theme Controls */}
        <div className="flex justify-between items-center mb-8">
          <LanguageSelector 
            currentLanguage={currentLanguage} 
            onLanguageChange={handleLanguageChange} 
          />
          <ThemeToggle 
            isDarkMode={isDarkMode} 
            onToggle={handleThemeToggle} 
          />
        </div>

        {/* Main Reset Password Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Réinitialiser le mot de passe
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Saisissez votre adresse email pour recevoir un lien de réinitialisation
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Comment ça marche :
            </h3>
            <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Saisissez votre adresse email ci-dessous</li>
              <li>Cliquez sur "Envoyer le lien de réinitialisation"</li>
              <li>Vérifiez votre boîte email (et les spams)</li>
              <li>Cliquez sur le lien reçu pour définir un nouveau mot de passe</li>
            </ol>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                  {cooldown > 0 && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Renvoyer le lien dans {cooldown}s
                      </span>
                      <button
                        onClick={handleResend}
                        disabled={cooldown > 0}
                        className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
                      >
                        Renvoyer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || cooldown > 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour à la connexion
              </Link>
            </div>
          </form>

          {/* Email Delivery Notice */}
          <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              <strong>Note :</strong> Si vous ne recevez pas l'email dans les 5 minutes, vérifiez votre dossier spam ou contactez le support technique.
              Le lien de réinitialisation expire après 1 heure pour des raisons de sécurité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;