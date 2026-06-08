const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extension: '.js' },
  { value: 'typescript', label: 'TypeScript', extension: '.ts' },
  { value: 'python', label: 'Python', extension: '.py' },
  { value: 'java', label: 'Java', extension: '.java' },
  { value: 'cpp', label: 'C++', extension: '.cpp' },
  { value: 'c', label: 'C', extension: '.c' },
  { value: 'csharp', label: 'C#', extension: '.cs' },
  { value: 'go', label: 'Go', extension: '.go' },
  { value: 'rust', label: 'Rust', extension: '.rs' },
  { value: 'php', label: 'PHP', extension: '.php' },
  { value: 'ruby', label: 'Ruby', extension: '.rb' },
  { value: 'swift', label: 'Swift', extension: '.swift' },
  { value: 'kotlin', label: 'Kotlin', extension: '.kt' },
  { value: 'scala', label: 'Scala', extension: '.scala' },
  { value: 'html', label: 'HTML', extension: '.html' },
  { value: 'css', label: 'CSS', extension: '.css' },
  { value: 'sql', label: 'SQL', extension: '.sql' },
];

const LanguageSelector = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input max-w-xs"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  );
};

export { LANGUAGES };
export default LanguageSelector;
