import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import './LandingPage.css'

const workflow = [
  {
    title: 'Подключите репозиторий',
    detail:
      'Выберите проект и настройте интеграции LLM. После этого CodeSage начнёт собирать контекст автоматически.',
  },
  {
    title: 'Запустите анализ изменений',
    detail:
      'Проверяйте коммиты и PR/MR до мержа: рекомендации по рискам, качеству и тестовому покрытию появляются в одном отчете.',
  },
  {
    title: 'Доведите ревью до решения',
    detail:
      'Фиксируйте выводы, сохраняйте историю решений и повторно используйте контекст для следующих итераций.',
  },
]

const highlights = [
  {
    title: 'Коммиты на ладони',
    detail: 'Сразу видно изменённые файлы, ключевые метрики и приоритетные зоны внимания.',
  },
  {
    title: 'PR/MR Insights',
    detail:
      'Каждая заявка на слияние оценивается по безопасности, производительности и качеству тестирования.',
  },
  {
    title: 'Журнал решений',
    detail: 'Контекст прошлых рекомендаций сохраняется и помогает быстрее принимать обоснованные решения.',
  },
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
    ? { label: 'Перейти в Workspace', to: '/workspace' }
    : { label: 'Начать работу', to: '/auth' }

  return (
    <main className="landing-page">
      <section className="landing-panel">
        <header className="landing-head">
          <div>
            <p className="eyebrow">CodeSage</p>
            <h1>AI-ассистент для спокойных и точных code review</h1>
            <p className="landing-subtitle">
              Единый поток для анализа коммитов и PR/MR: меньше ручной рутины, больше понятных решений
              по качеству кода.
            </p>
          </div>
          <p className={`landing-status ${isAuthenticated ? 'landing-status--ready' : ''}`}>
            {isAuthenticated ? 'Готов к ревью' : 'Ожидает входа'}
          </p>
        </header>

        <section className="landing-hero" aria-label="Быстрый старт">
          <div className="landing-hero__content">
            <p className="landing-ready">{readyText}</p>
            <div className="landing-actions">
              <Link className="landing-action landing-action--primary" to={primaryAction.to}>
                {primaryAction.label}
              </Link>
              <Link className="landing-action" to="/docs">
                Открыть документацию
              </Link>
            </div>
          </div>

          <aside className="landing-hero__stats" aria-label="Ключевые преимущества">
            <article>
              <p className="stat-value">1 поток</p>
              <p className="stat-label">коммиты, PR/MR и рекомендации в одной панели</p>
            </article>
            <article>
              <p className="stat-value">До мержа</p>
              <p className="stat-label">проблемные места видны до попадания в main</p>
            </article>
            <article>
              <p className="stat-value">История</p>
              <p className="stat-label">каждое решение сохраняет контекст команды</p>
            </article>
          </aside>
        </section>

        <section className="landing-workflow" aria-label="Как это работает">
          {workflow.map((step, index) => (
            <article key={step.title}>
              <p className="workflow-step">Шаг {index + 1}</p>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </section>

        <section className="landing-highlights" aria-label="Основные возможности">
          {highlights.map((block) => (
            <article key={block.title}>
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
