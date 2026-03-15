import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'my' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  my: {
    'app.title': 'မြန်မာ ၂D လော်တারီ အကျဉ်းချုပ်',
    'app.description': 'ကြေးမုံရွာ ၂D လော်တারီ အကျဉ်းချုပ်',
    'nav.customers': 'ဝယ်ယူသူများ',
    'nav.winners': 'အနိုင်ရှင်များ',
    'nav.settings': 'ဆက်တင်များ',
    'customers.title': 'ဝယ်ယူသူ စာရင်း',
    'customers.description': 'ဝယ်ယူသူ လောင်းကြေးမှတ်တမ်းများ စီမံခန့်ခွဲခြင်း',
    'customers.totalCustomers': 'စုစုပေါင်းဝယ်ယူသူများ',
    'customers.cash': 'လက်ငင်း',
    'customers.credit': 'အကြွေး',
    'customers.totalBets': 'စုစုပေါင်းလောင်းကြေး',
    'customers.addNew': 'ဝယ်ယူသူအသစ်ထည့်သွင်းခြင်း',
    'customers.searchByDate': 'နေ့စွဲအလိုက်ရှာဖွေခြင်း',
    'customers.noCust': 'ဝယ်ယူသူများမရှိသေးပါ',
    'customers.addFirst': 'စတင်ရန်ပထမဆုံးဝယ်ယူသူထည့်သွင်းခြင်း',
    'winners.title': 'အနိုင်ရှင်ရှာဖွေခြင်း',
    'winners.description': 'အနိုင်ရှင်နံပါတ်ပေါ်တွင်လောင်းကြေးထားသောဝယ်ယူသူများရှာဖွေခြင်း',
    'winners.enterNumber': 'အနိုင်ရှင်နံပါတ်ထည့်သွင်းခြင်း',
    'winners.search': 'ရှာဖွေခြင်း',
    'winners.clear': 'ရှင်းလင်းခြင်း',
    'winners.totalWinners': 'စုစုပေါင်းအနိုင်ရှင်များ',
    'winners.cashWinners': 'လက်ငင်းအနိုင်ရှင်များ',
    'winners.totalPayout': 'စုစုပေါင်းငွေချေခြင်း',
    'winners.noWinners': 'အနိုင်ရှင်များမရှိပါ',
    'winners.searchByDate': 'နေ့စွဲအလိုက်ရှာဖွေခြင်း',
    'winners.winningNumber': 'အနိုင်ရှင်နံပါတ်',
    'settings.title': 'ဆက်တင်များ',
    'settings.darkTheme': 'အမှောင်ခေါင်းစဉ်',
    'settings.language': 'ဘာသာစကား',
    'settings.myanmar': 'မြန်မာ',
    'settings.english': 'အင်္ဂလိပ်',
    'modal.addCustomer': 'ဝယ်ယူသူထည့်သွင်းခြင်း',
    'modal.customerName': 'ဝယ်ယူသူအမည်',
    'modal.bettingData': 'လောင်းကြေးအချက်အလက်',
    'modal.date': 'နေ့စွဲ',
    'modal.time': 'အချိန်',
    'modal.session': 'အချိန်ကြိုးကွင်း',
    'modal.morning': 'နံနက်',
    'modal.evening': 'ညနေ',
    'modal.bettingType': 'လောင်းကြေးအမျိုးအစား',
    'modal.2d': '၂D',
    'modal.3d': '၃D',
    'modal.paymentType': 'ငွေချေမှုအမျိုးအစား',
    'modal.cash': 'လက်ငင်း',
    'modal.credit': 'အကြွေး',
    'modal.weeklyClear': 'တစ်ပတ်ရှင်းခြင်း',
    'modal.addButton': 'ထည့်သွင်းခြင်း',
    'modal.cancel': 'ပယ်ဖျက်ခြင်း',
    'modal.editCustomer': 'ဝယ်ယူသူပြင်ဆင်ခြင်း',
    'modal.updateButton': 'အဆင့်မြှင့်တင်ခြင်း',
    'modal.searchByDate': 'နေ့စွဲအလိုက်ဝယ်ယူသူများရှာဖွေခြင်း',
  },
  en: {
    'app.title': 'Myanmar 2D Lottery Summarizer',
    'app.description': 'Myanmar 2D Lottery Betting Summarizer',
    'nav.customers': 'Customers',
    'nav.winners': 'Winners',
    'nav.settings': 'Settings',
    'customers.title': 'Customer List',
    'customers.description': 'Manage customer betting records',
    'customers.totalCustomers': 'Total Customers',
    'customers.cash': 'Cash',
    'customers.credit': 'Credit',
    'customers.totalBets': 'Total Bets',
    'customers.addNew': 'Add New Customer',
    'customers.searchByDate': 'Search by Date',
    'customers.noCust': 'No customers yet',
    'customers.addFirst': 'Add your first customer to get started',
    'winners.title': 'Winner Search',
    'winners.description': 'Find customers who bet on the winning number',
    'winners.enterNumber': 'Enter Winning Number',
    'winners.search': 'Search',
    'winners.clear': 'Clear',
    'winners.totalWinners': 'Total Winners',
    'winners.cashWinners': 'Cash Winners',
    'winners.totalPayout': 'Total Payout',
    'winners.noWinners': 'No winners found',
    'winners.searchByDate': 'Search by Date',
    'winners.winningNumber': 'Enter Winning Number',
    'settings.title': 'Settings',
    'settings.darkTheme': 'Dark Theme',
    'settings.language': 'Language',
    'settings.myanmar': 'Myanmar',
    'settings.english': 'English',
    'modal.addCustomer': 'Add New Customer',
    'modal.customerName': 'Customer Name',
    'modal.bettingData': 'Betting Data',
    'modal.date': 'Date',
    'modal.time': 'Time',
    'modal.session': 'Session',
    'modal.morning': 'Morning',
    'modal.evening': 'Evening',
    'modal.bettingType': 'Betting Type',
    'modal.2d': '2D',
    'modal.3d': '3D',
    'modal.paymentType': 'Payment Type',
    'modal.cash': 'Cash',
    'modal.credit': 'Credit',
    'modal.weeklyClear': 'Weekly Clear',
    'modal.addButton': 'Add Customer',
    'modal.cancel': 'Cancel',
    'modal.editCustomer': 'Edit Customer',
    'modal.updateButton': 'Update Customer',
    'modal.searchByDate': 'Search Customers by Date',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language | null;
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
