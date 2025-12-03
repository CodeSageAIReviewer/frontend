import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import './LandingPage.css'

const story = [
  'CodeSage анализирует коммиты, Pull/Merge Requestы и diff-ы автоматически, чтобы вы сразу видели потенциальные ошибки и рекомендации.',
  'Алгоритмы ИИ сопоставляют текущие изменения с историей репозитория и корпоративными правилами, чтобы показать точные советы по стилю и архитектуре.',
  'Вы можете запускать инспекции перед пушем или прямо в CI, а интерфейс подскажет, какие места требуют внимания.',
]

const highlights = [
  { title: 'Коммиты на ладони', detail: 'Вы сразу видите изменённые файлы, ключевые метрики и эмоциональный тон коммита.' },
  { title: 'PR/MR Insights', detail: 'Анализируйте каждую заявку на слияние и получайте рекомендации по безопасности, производительности и тестированию.' },
  { title: 'Журнал решений', detail: 'Умный журнал сохраняет контекст и объясняет, почему совет был выдан.' },
]

function LandingPage() {
  const { isAuthenticated } = useAuth()

  const readyText = useMemo(
    () =>
      isAuthenticated
        ? 'Токены в порядке, вы можете запускать ревью или перемещаться по разделам.'
        : 'Войдите, чтобы начать собирать рекомендации по вашим Merge Request и коммитам.',
    [isAuthenticated],
  )

  return (
    <main className="landing-page">
      <section className="landing-panel">
        <header className="landing-head">
          <div>
            <p className="eyebrow">CodeSage</p>
            <h1>AI-ассистент для спокойных и точных code review</h1>
            <p className="landing-subtitle">
              Структурированная панель, которая показывает вам коммиты, pull / merge requestы и
              рекомендации ИИ в едином потоке.
            </p>
          </div>
        </header>
        <p className="landing-ready">{readyText}</p>
        <div className="landing-story">
          {story.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="landing-highlights">
          {highlights.map((block) => (
            <article key={block.title}>
              <h3>{block.title}</h3>
              <p>{block.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default LandingPage
