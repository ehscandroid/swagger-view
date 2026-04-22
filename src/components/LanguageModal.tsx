export const LANGUAGES = [
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  // { code: "fr", name: "Français", flag: "🇫🇷" },
  // { code: "it", name: "Italiano", flag: "🇮🇹" },
  // { code: "pt", name: "Português", flag: "🇵🇹" },
];

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  current: string;
  onSelect: (code: string) => void;
}

const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose, current, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-center mb-4 text-gray-900 dark:text-gray-100">
          Select Language
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                onSelect(lang.code);
                onClose();
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition ${
                current === lang.code 
                  ? "bg-[#4D76C6]/10 dark:bg-[#91B0F8]/20 ring-2 ring-[#4D76C6] dark:ring-[#91B0F8]"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;