import React from 'react';


const LoginHeader = ({ currentLanguage }) => {
  const translations = {
    en: {
      welcome: 'Welcome to Estalio',
      subtitle: 'Sign in to your property management dashboard',
      description: 'Manage your vacation rentals and hospitality business with ease'
    },
    fr: {
      welcome: 'Bienvenue sur Estalio',
      subtitle: 'Connectez-vous à votre tableau de bord de gestion immobilière',
      description: 'Gérez vos locations de vacances et votre entreprise hôtelière en toute simplicité'
    },
    ar: {
      welcome: 'مرحباً بك في Estalio',
      subtitle: 'قم بتسجيل الدخول إلى لوحة إدارة الممتلكات الخاصة بك',
      description: 'إدارة إيجارات العطلات وأعمال الضيافة بسهولة'
    }
  };

  const t = translations?.[currentLanguage] || translations?.en;

  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-3xl">E</span>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">
        {t?.welcome}
      </h1>
      <p className="text-lg text-muted-foreground mb-2">
        {t?.subtitle}
      </p>
      <p className="text-sm text-muted-foreground">
        {t?.description}
      </p>
    </div>
  );
};

export default LoginHeader;