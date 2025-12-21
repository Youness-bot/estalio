import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Shield, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import LoginHeader from '../login/components/LoginHeader';
import LanguageSelector from '../login/components/LanguageSelector';
import ThemeToggle from '../login/components/ThemeToggle';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if we have a valid reset token
    const checkResetToken = async () => {
      try {
        const { data: { session }, error } = await supabase?.auth?.getSession();
        
        if (error) {
          setTokenValid(false);
          setError('Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.');
          return;
        }

        if (!session) {
          setTokenValid(false);
          setError('Aucune session de réinitialisation trouvée. Veuillez cliquer sur le lien dans votre email.');
          return;
        }

        setTokenValid(true);
      } catch (err) {
        setTokenValid(false);
        setError('Erreur lors de la validation du token. Veuillez réessayer.');
      }
    };

    checkResetToken();
  }, []);

  const calculatePasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password?.length >= 8) {
      score += 1;
    } else {
      feedback?.push('Au moins 8 caractères');
    }

    if (/[a-z]/?.test(password)) {
      score += 1;
    } else {
      feedback?.push('Une lettre minuscule');
    }

    if (/[A-Z]/?.test(password)) {
      score += 1;
    } else {
      feedback?.push('Une lettre majuscule');
    }

    if (/[0-9]/?.test(password)) {
      score += 1;
    } else {
      feedback?.push('Un chiffre');
    }

    if (/[^A-Za-z0-9]/?.test(password)) {
      score += 1;
    } else {
      feedback?.push('Un caractère spécial');
    }

    return { score, feedback };
  };

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update password strength for password field
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData?.password || !formData?.confirmPassword) {
      setError('Tous les champs sont requis');
      return false;
    }

    if (formData?.password?.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    if (formData?.password !== formData?.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (passwordStrength?.score < 3) {
      setError('Le mot de passe n\'est pas assez fort. Veuillez suivre les recommandations.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase?.auth?.updateUser({ 
        password: formData?.password 
      });

      if (error) {
        setError(error?.message || 'Erreur lors de la mise à jour du mot de passe');
      } else {
        setSuccess('Mot de passe mis à jour avec succès ! Redirection vers la page de connexion...');
        setFormData({ password: '', confirmPassword: '' });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (score) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (score) => {
    if (score <= 1) return 'Très faible';
    if (score <= 2) return 'Faible';
    if (score <= 3) return 'Moyen';
    if (score <= 4) return 'Fort';
    return 'Très fort';
  };

  // Show loading state while checking token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Validation du lien de réinitialisation...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <LoginHeader currentLanguage={currentLanguage} />
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Lien invalide
              </h2>
            </div>

            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>

            <div className="text-center space-y-4">
              <Link 
                to="/reset-password" 
                className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Demander un nouveau lien
              </Link>
              
              <Link 
                to="/login" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            onLanguageChange={setCurrentLanguage} 
          />
          <ThemeToggle 
            isDarkMode={isDarkMode} 
            onToggle={setIsDarkMode} 
          />
        </div>

        {/* Main Update Password Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Nouveau mot de passe
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Définissez un nouveau mot de passe sécurisé pour votre compte
            </p>
          </div>

          {/* Security Requirements */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Exigences de sécurité :
            </h3>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li className={`flex items-center ${formData?.password?.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                <CheckCircle className={`w-3 h-3 mr-2 ${formData?.password?.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} />
                Au moins 8 caractères
              </li>
              <li className={`flex items-center ${/[a-z]/?.test(formData?.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                <CheckCircle className={`w-3 h-3 mr-2 ${/[a-z]/?.test(formData?.password) ? 'text-green-500' : 'text-gray-400'}`} />
                Une lettre minuscule
              </li>
              <li className={`flex items-center ${/[A-Z]/?.test(formData?.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                <CheckCircle className={`w-3 h-3 mr-2 ${/[A-Z]/?.test(formData?.password) ? 'text-green-500' : 'text-gray-400'}`} />
                Une lettre majuscule
              </li>
              <li className={`flex items-center ${/[0-9]/?.test(formData?.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                <CheckCircle className={`w-3 h-3 mr-2 ${/[0-9]/?.test(formData?.password) ? 'text-green-500' : 'text-gray-400'}`} />
                Un chiffre
              </li>
              <li className={`flex items-center ${/[^A-Za-z0-9]/?.test(formData?.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                <CheckCircle className={`w-3 h-3 mr-2 ${/[^A-Za-z0-9]/?.test(formData?.password) ? 'text-green-500' : 'text-gray-400'}`} />
                Un caractère spécial (!@#$%^&*)
              </li>
            </ul>
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
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData?.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Saisissez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData?.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Force du mot de passe
                    </span>
                    <span className={`text-xs font-medium ${passwordStrength?.score >= 3 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {getStrengthLabel(passwordStrength?.score)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength?.score)}`}
                      style={{ width: `${(passwordStrength?.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  {passwordStrength?.feedback?.length > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Manque : {passwordStrength?.feedback?.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData?.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {formData?.confirmPassword && (
                <div className="mt-1">
                  {formData?.password === formData?.confirmPassword ? (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Les mots de passe correspondent
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || passwordStrength?.score < 3 || formData?.password !== formData?.confirmPassword}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Shield className="w-5 h-5 mr-2" />
              )}
              {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
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

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              <strong>Sécurité :</strong> Une fois votre mot de passe mis à jour, vous serez automatiquement déconnecté de tous vos autres appareils.
              Nous vous recommandons d'utiliser un gestionnaire de mots de passe pour créer et stocker des mots de passe sécurisés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;