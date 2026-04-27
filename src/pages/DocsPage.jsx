import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './DocsPage.css'

const llmScreenshot = new URL('../../docs/llm/1.png', import.meta.url).href
const workspaceScreenshot = new URL('../../docs/workspace/1.png', import.meta.url).href
const integrationScreenshot = new URL('../../docs/integration/1.png', import.meta.url).href
const repositorySelectScreenshot = new URL('../../docs/repository/1.png', import.meta.url).href
const repositoryPageScreenshot = new URL('../../docs/repository/2.png', import.meta.url).href
const mrListScreenshot = new URL('../../docs/merge-request/1.png', import.meta.url).href
const mrDetailScreenshot = new URL('../../docs/merge-request/2.png', import.meta.url).href
const mrRunScreenshot = new URL('../../docs/merge-request/3.png', import.meta.url).href
const mrHistoryScreenshot = new URL('../../docs/merge-request/4.png', import.meta.url).href
const mrReviewScreenshot = new URL('../../docs/merge-request/5.png', import.meta.url).href

const DOC_VERSION = 'v1.0'
const DOC_UPDATED_AT = '26 апреля 2026'
const SCROLL_OFFSET = 108

const QUICK_START = [
  'Подключите LLM-провайдера и Git-интеграцию.',
  'Создайте workspace и добавьте репозиторий.',
  'Откройте Merge Request (MR) и запустите AI-ревью.',
  'Проверьте замечания, при необходимости опубликуйте комментарии в MR.',
]

const DOC_SECTIONS = [
  {
    id: 'llm',
    label: 'LLM',
    summary:
      'Раздел про подключение и поддержку LLM-провайдеров для AI-ревью.',
    quickFacts: ['Создание и редактирование интеграций', 'Поддержка OpenAI / DeepSeek / Ollama', 'Настройка model, base URL и API key'],
    blocks: [
      {
        type: 'figure',
        src: llmScreenshot,
        alt: 'Окно управления LLM интеграциями',
        caption: 'Окно LLM-интеграций',
      },
      {
        type: 'list',
        title: 'Что можно сделать',
        items: ['Добавить новую LLM-интеграцию.', 'Изменить параметры существующей интеграции.', 'Удалить интеграцию, если она больше не нужна.'],
      },
      {
        type: 'list',
        title: 'Поля при создании',
        items: [
          'Название: удобное имя интеграции в интерфейсе.',
          'Провайдер: OpenAI, DeepSeek или Ollama.',
          'Модель: точное имя модели (например, deepseek-chat).',
          'Base URL: базовый адрес API провайдера.',
          'API key: ключ доступа (для провайдеров, где он обязателен).',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Совет',
        text: 'После сохранения интеграция сразу доступна в блоке запуска ревью.',
      },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    summary:
      'Workspace объединяет рабочие папки, Git-интеграции и подключенные репозитории.',
    quickFacts: ['Единая рабочая зона команды', 'Связка с GitHub/GitLab', 'Быстрый вход к анализу репозиториев'],
    blocks: [
      {
        type: 'figure',
        src: workspaceScreenshot,
        alt: 'Страница рабочей зоны Workspace',
        caption: 'Главная страница Workspace',
      },
      {
        type: 'list',
        title: 'Базовый сценарий',
        items: ['Создайте рабочую папку для проекта или команды.', 'Подключите Git-интеграцию.', 'Добавьте репозиторий из доступного списка интеграции.'],
      },
    ],
  },
  {
    id: 'integration',
    label: 'Git Integration',
    summary:
      'Git-интеграция связывает CodeSage с провайдером исходного кода и открывает доступ к репозиториям.',
    quickFacts: ['Провайдер: GitHub или GitLab', 'Base URL и токены доступа', 'Используется для импорта репозиториев'],
    blocks: [
      {
        type: 'figure',
        src: integrationScreenshot,
        alt: 'Окно настройки Git-интеграции',
        caption: 'Настройка Git-интеграции',
        small: true,
      },
      {
        type: 'list',
        title: 'Поля интеграции',
        items: [
          'Name: отображаемое название подключения.',
          'Provider: GitHub или GitLab.',
          'Base URL: API адрес провайдера (например, https://api.github.com).',
          'Access token: основной токен доступа.',
          'Refresh token: токен обновления (если применяется).',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Важно',
        text: 'Без корректной Git-интеграции список репозиториев и MR недоступен.',
      },
    ],
  },
  {
    id: 'repository',
    label: 'Repository',
    summary:
      'В этом разделе описано добавление репозитория и переход к списку Merge Request (MR).',
    quickFacts: ['Выбор репозитория из интеграции', 'Подтверждение добавления', 'Переход к списку MR'],
    blocks: [
      {
        type: 'figure',
        src: repositorySelectScreenshot,
        alt: 'Выбор и добавление репозитория',
        caption: 'Выбор репозитория перед добавлением',
      },
      {
        type: 'text',
        paragraphs: [
          'Система показывает проекты, доступные для выбранной Git-интеграции. Выберите нужный репозиторий и подтвердите добавление.',
          'После добавления репозиторий появится в списке workspace.',
        ],
      },
      {
        type: 'figure',
        src: repositoryPageScreenshot,
        alt: 'Страница репозитория со списком Merge Request',
        caption: 'Страница репозитория со списком MR',
      },
      {
        type: 'text',
        paragraphs: [
          'На странице репозитория отображаются MR проекта, их статусы и ключевая информация для выбора запуска ревью.',
        ],
      },
    ],
  },
  {
    id: 'merge-request',
    label: 'Merge Request (MR)',
    summary:
      'Полный путь работы с MR: список, запуск AI-ревью, история запусков, фильтры и публикация комментариев.',
    quickFacts: ['Фильтры по статусу и названию', 'Запуск и повторный запуск ревью', 'Публикация комментариев в MR'],
    blocks: [
      {
        type: 'figure',
        src: mrListScreenshot,
        alt: 'Список Merge Request',
        caption: 'Список Merge Request (MR)',
      },
      {
        type: 'list',
        title: 'Статусы MR',
        items: ['Open: MR открыт и ожидает ревью/слияния.', 'Closed: MR закрыт без слияния.', 'Merged: MR успешно объединен.'],
      },
      {
        type: 'list',
        title: 'Фильтры списка',
        items: ['Status: фильтрация по состоянию MR.', 'Title: поиск по названию MR.'],
      },
      {
        type: 'figure',
        src: mrDetailScreenshot,
        alt: 'Подробный просмотр Merge Request',
        caption: 'Панель управления ревью внутри MR',
      },
      {
        type: 'figure',
        src: mrRunScreenshot,
        alt: 'Блок запуска ревью',
        caption: 'Запуск AI-ревью',
      },
      {
        type: 'list',
        title: 'Запуск ревью',
        items: [
          'LLM integration: выбор провайдера для анализа.',
          'Run AI Review: запуск нового анализа текущего MR.',
          'Re-run: повторный запуск для выбранного прогона.',
          'Публиковать комментарии после завершения: автопостинг в MR.',
        ],
      },
      {
        type: 'figure',
        src: mrHistoryScreenshot,
        alt: 'История запусков ревью',
        caption: 'История запусков ревью',
      },
      {
        type: 'list',
        title: 'Статусы запуска ревью',
        items: [
          'В очереди: запуск ожидает выполнения.',
          'Выполняется: ревью в процессе.',
          'Успешно/Готово: ревью завершено без критичных ошибок.',
          'Ошибка: запуск завершился с ошибкой.',
          'Отменено: запуск остановлен пользователем.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Автообновление',
        text: 'Если запуск в статусе «В очереди» или «Выполняется», интерфейс обновляет данные каждые 15 секунд.',
      },
      {
        type: 'figure',
        src: mrReviewScreenshot,
        alt: 'Детали ревью',
        caption: 'Детали AI-ревью',
      },
      {
        type: 'list',
        title: 'Что видно в деталях ревью',
        items: [
          'Итоговый статус выбранного запуска.',
          'Количество найденных комментариев.',
          'Количество файлов с замечаниями.',
          'Количество серьезных замечаний.',
        ],
      },
      {
        type: 'list',
        title: 'Фильтры комментариев',
        items: [
          'Severity: Error / Warning / Info.',
          'Type: General / Code smell / Bug / Security / Performance / Style / Tests / Documentation.',
          'File: фильтрация по конкретному файлу.',
        ],
      },
      {
        type: 'list',
        title: 'Формат комментария',
        items: [
          'Severity и Type.',
          'File:Line, к которым относится замечание.',
          'Статус публикации в MR.',
          'Подробное описание проблемы и рекомендация по исправлению.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'Публикация в MR',
        text: 'Кнопка Publish to MR отправляет подготовленные комментарии в выбранный Merge Request.',
      },
    ],
  },
]

const INITIAL_COLLAPSED = DOC_SECTIONS.reduce((acc, section, index) => {
  acc[section.id] = index !== 0
  return acc
}, {})

function DocsPage() {
  const sectionRefs = useRef({})
  const validIds = useMemo(() => DOC_SECTIONS.map((section) => section.id), [])

  const hashSection = useMemo(() => {
    const hash = window.location.hash.replace('#', '')
    return validIds.includes(hash) ? hash : 'llm'
  }, [validIds])

  const [activeSection, setActiveSection] = useState(hashSection)
  const [collapsedSections, setCollapsedSections] = useState(() => {
    const next = { ...INITIAL_COLLAPSED }
    next[hashSection] = false
    return next
  })
  const [lightbox, setLightbox] = useState(null)
  const [isBackTopVisible, setIsBackTopVisible] = useState(false)

  const setSectionNode = useCallback((sectionId, node) => {
    if (!node) {
      delete sectionRefs.current[sectionId]
      return
    }
    sectionRefs.current[sectionId] = node
  }, [])

  const openSectionContent = useCallback((sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: false,
    }))
  }, [])

  const scrollToSection = useCallback((sectionId, smooth = true) => {
    const node = sectionRefs.current[sectionId]
    if (!node) {
      return
    }

    const top = node.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
    window.scrollTo({
      top,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  const handleSectionOpen = useCallback(
    (event, sectionId) => {
      event.preventDefault()
      openSectionContent(sectionId)
      setActiveSection(sectionId)
      scrollToSection(sectionId)
    },
    [openSectionContent, scrollToSection],
  )

  const handleSectionToggle = useCallback((sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible.length === 0) {
          return
        }

        const topVisible = visible[0].target.id
        if (!topVisible || !validIds.includes(topVisible)) {
          return
        }

        setActiveSection((prev) => (prev === topVisible ? prev : topVisible))
      },
      {
        root: null,
        rootMargin: '-120px 0px -45% 0px',
        threshold: [0.2, 0.35, 0.5, 0.7],
      },
    )

    DOC_SECTIONS.forEach((section) => {
      const node = sectionRefs.current[section.id]
      if (node) {
        observer.observe(node)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [validIds])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (!hash || !validIds.includes(hash)) {
        return
      }

      openSectionContent(hash)
      setActiveSection(hash)
      scrollToSection(hash, false)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [openSectionContent, scrollToSection, validIds])

  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '')
    if (currentHash === activeSection) {
      return
    }

    window.history.replaceState(null, '', `#${activeSection}`)
  }, [activeSection])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setLightbox(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsBackTopVisible(window.scrollY > 520)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const backToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <main className="docs-page" id="docs-top">
      <header className="docs-hero">
        <div className="docs-hero__top">
          <div>
            <p className="docs-eyebrow">Documentation</p>
            <h1>Руководство пользователя CodeSage</h1>
          </div>
          <div className="docs-meta" aria-label="Метаданные документации">
            <p>Версия: {DOC_VERSION}</p>
            <p>Обновлено: {DOC_UPDATED_AT}</p>
          </div>
        </div>

        <div className="docs-quickstart" aria-label="Быстрый старт">
          <h2>Quick Start</h2>
          <ol>
            {QUICK_START.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <div className="docs-quickstart__actions">
            <Link className="docs-hero__action docs-hero__action--primary" to="/workspace">
              Перейти в Workspace
            </Link>
            <a className="docs-hero__action" href="#merge-request" onClick={(event) => handleSectionOpen(event, 'merge-request')}>
              Сразу к разделу MR
            </a>
          </div>
        </div>
      </header>

      <div className="docs-layout">
        <nav className="docs-toc" aria-label="Оглавление документации">
          <p className="docs-toc__title">Оглавление</p>
          <ul>
            {DOC_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={
                    section.id === activeSection
                      ? 'docs-toc__link docs-toc__link--active'
                      : 'docs-toc__link'
                  }
                  aria-current={section.id === activeSection ? 'location' : undefined}
                  onClick={(event) => handleSectionOpen(event, section.id)}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="docs-content">
          {DOC_SECTIONS.map((section) => {
            const isActive = section.id === activeSection
            const isCollapsed = collapsedSections[section.id]

            return (
              <section
                key={section.id}
                id={section.id}
                ref={(node) => setSectionNode(section.id, node)}
                className={isActive ? 'docs-section is-active' : 'docs-section'}
              >
                <header className="docs-section__head">
                  <div>
                    <p className="docs-section__eyebrow">Раздел</p>
                    <h2>{section.label}</h2>
                  </div>
                  <button
                    type="button"
                    className="docs-section__toggle"
                    onClick={() => handleSectionToggle(section.id)}
                    aria-expanded={!isCollapsed}
                    aria-controls={`${section.id}-content`}
                  >
                    {isCollapsed ? 'Развернуть' : 'Свернуть'}
                  </button>
                </header>

                <p className="docs-section__summary">{section.summary}</p>

                <ul className="docs-section__facts" aria-label={`Ключевые пункты раздела ${section.label}`}>
                  {section.quickFacts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>

                {!isCollapsed && (
                  <div className="docs-section__body" id={`${section.id}-content`}>
                    {section.blocks.map((block, blockIndex) => {
                      const key = `${section.id}-${block.type}-${blockIndex}`

                      if (block.type === 'figure') {
                        return (
                          <figure key={key} className="docs-figure">
                            <button
                              type="button"
                              className="docs-figure__trigger"
                              onClick={() =>
                                setLightbox({
                                  src: block.src,
                                  alt: block.alt,
                                  caption: block.caption,
                                })
                              }
                              aria-label={`Открыть изображение: ${block.caption}`}
                            >
                              <img
                                className={
                                  block.small
                                    ? 'docs-figure__image docs-figure__image--small'
                                    : 'docs-figure__image'
                                }
                                src={block.src}
                                alt={block.alt}
                                loading="lazy"
                              />
                            </button>
                            <figcaption className="docs-figure__caption">{block.caption}</figcaption>
                          </figure>
                        )
                      }

                      if (block.type === 'text') {
                        return (
                          <div key={key} className="docs-subsection">
                            {block.paragraphs.map((paragraph) => (
                              <p key={paragraph} className="docs-section__text">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        )
                      }

                      if (block.type === 'list') {
                        return (
                          <div key={key} className="docs-subsection">
                            <h3>{block.title}</h3>
                            <ul className="docs-list">
                              {block.items.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )
                      }

                      if (block.type === 'callout') {
                        const calloutClass =
                          block.tone === 'tip'
                            ? 'docs-callout docs-callout--tip'
                            : 'docs-callout docs-callout--info'

                        return (
                          <aside key={key} className={calloutClass} aria-label={block.title}>
                            <p className="docs-callout__title">{block.title}</p>
                            <p className="docs-callout__text">{block.text}</p>
                          </aside>
                        )
                      }

                      return null
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </div>

      {isBackTopVisible && (
        <button type="button" className="docs-backtop" onClick={backToTop}>
          Наверх
        </button>
      )}

      {lightbox && (
        <div
          className="docs-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.caption}
          onClick={() => setLightbox(null)}
        >
          <div className="docs-lightbox__content" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="docs-lightbox__close"
              onClick={() => setLightbox(null)}
            >
              Закрыть
            </button>
            <img src={lightbox.src} alt={lightbox.alt} />
            <p>{lightbox.caption}</p>
          </div>
        </div>
      )}
    </main>
  )
}

export default DocsPage
