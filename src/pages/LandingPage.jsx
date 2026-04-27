import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import './LandingPage.css'

const workflow = [
  {
    title: 'Подключите рабочее пространство',
    detail:
      'Добавьте Git и LLM интеграции, чтобы система могла собирать контекст изменений автоматически.',
  },
  {
    title: 'Запустите ревью по MR/PR',
    detail:
      'Выберите нужный merge request и запустите AI-ревью с вашей моделью в один клик.',
  },
  {
    title: 'Разберите находки и примите решение',
    detail:
      'Фильтруйте замечания по серьёзности, публикуйте комментарии и фиксируйте историю запусков.',
  },
]

const highlights = [
  {
    title: 'Один рабочий контур',
    detail: 'Репозитории, MR, запуски ревью и комментарии объединены в едином интерфейсе.',
  },
  {
    title: 'Прозрачные статусы',
    detail:
      'Видно, что сейчас выполняется, что опубликовано и где нужны действия команды.',
  },
  {
    title: 'История решений',
    detail: 'Каждый запуск и его результат сохраняются, чтобы возвращаться к выводам без потери контекста.',
  },
]

const contextBullets = [
  'Поддержка GitHub/GitLab и OpenAI/DeepSeek/Ollama',
  'Фокус на качестве, рисках и готовности к merge',
  'Управляемый процесс: запуск, проверка, публикация',
]

function LandingPage() {
  const { isAuthenticated } = useAuth()

  const readyText = useMemo(
    () =>
      isAuthenticated
        ? 'Токены подключены. Можно сразу переходить к workspace и запускать ревью.'
        : 'Чтобы начать работу, войдите и подключите модель для анализа репозитория.',
    [isAuthenticated],
  )

  const primaryAction = isAuthenticated
    ? { label: 'Открыть рабочее пространство', to: '/workspace' }
    : { label: 'Войти и начать ревью', to: '/auth' }

  return (
    <main className="landing-page">
      <section className="landing-layout">
        <header className="landing-hero ui-panel">
          <div className="landing-hero__main page-header">
            <p className="landing-eyebrow page-header__eyebrow">CodeSage Platform</p>
            <h1 className="page-header__title">Контроль качества кода перед merge без ручной рутины</h1>
            <p className="landing-subtitle page-header__description">
              Рабочая поверхность для запуска AI-ревью, приоритизации замечаний и принятия решений по PR/MR.
            </p>
            <div className="landing-hero__actions page-header__actions">
              <Link className="ui-btn ui-btn--primary landing-cta" to={primaryAction.to}>
                {primaryAction.label}
              </Link>
            </div>
            <p className="landing-hint">
              {readyText}{' '}
              <Link className="landing-text-link" to="/docs">
                Открыть документацию
              </Link>
            </p>
          </div>

          <aside className="landing-hero__context" aria-label="Контекст продукта">
            <p className={`landing-status ${isAuthenticated ? 'landing-status--ready' : ''}`}>
              {isAuthenticated ? 'Готово к запуску ревью' : 'Требуется вход в систему'}
            </p>
            <ul className="landing-context-list">
              {contextBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </header>

        <section className="landing-flow ui-panel" aria-label="Основной процесс">
          <header className="landing-section-head">
            <p className="landing-section-eyebrow">Основной процесс</p>
            <h2>От подключения до публикации замечаний</h2>
          </header>
          <div className="landing-flow__steps">
            {workflow.map((step, index) => (
              <article key={step.title} className="landing-step">
                <p className="landing-step__index">Шаг {index + 1}</p>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-highlights" aria-label="Ключевые преимущества">
          {highlights.map((block) => (
            <article key={block.title} className="landing-highlight ui-panel">
              <h3>{block.title}</h3>
              <p>{block.detail}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}

export default LandingPage
