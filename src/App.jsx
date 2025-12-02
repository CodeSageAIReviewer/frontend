import './App.css'

const features = [
  {
    title: 'Интеграция с Django',
    description: 'Проект готов к подключению к вашему backend через `VITE_API_BASE_URL`.',
  },
  {
    title: 'Docker-подготовка',
    description: 'Multi-stage билд + Nginx для быстрого деплоя.',
  },
  {
    title: 'Современная база',
    description: 'React + Vite без лишних зависимостей, чтобы начать разработку с нуля.',
  },
]

function App() {
  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">CodeSage AI Reviewer</p>
        <h1>Фронтенд готов к настройке</h1>
        <p className="hero-subtitle">
          Это точка входа для вашей панели: делайте изменения, добавляйте компоненты и подключайтесь к
          Django API. Весь конфиг упростит запуск через Docker и локальный `npm run dev`.
        </p>
        <div className="hero-actions">
          <a className="primary" href="https://vite.dev" target="_blank" rel="noreferrer">
            Документация Vite
          </a>
          <a className="secondary" href="https://react.dev" target="_blank" rel="noreferrer">
            Документация React
          </a>
        </div>
      </header>

      <section className="features">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default App
