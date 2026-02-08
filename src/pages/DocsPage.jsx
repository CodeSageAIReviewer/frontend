import { useCallback, useMemo, useState } from 'react'
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

const DOC_SECTIONS = [
  { id: 'llm', label: 'LLM' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'integration', label: 'Integration' },
  { id: 'repository', label: 'Repository' },
  { id: 'merge-request', label: 'Merge Request' },
]

function DocsPage() {
  const [activeSection, setActiveSection] = useState('llm')

  const handleSectionOpen = useCallback((sectionId) => {
    setActiveSection(sectionId)
    const node = document.getElementById(sectionId)
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const sectionMap = useMemo(() => {
    const map = {}
    DOC_SECTIONS.forEach((section) => {
      map[section.id] = section.label
    })
    return map
  }, [])

  return (
    <main className="docs-page">
      <header className="docs-hero">
        <div>
          <h1>Руководство пользователя</h1>
          <p className="docs-subtitle">
            Выберите раздел ниже. Он откроется на этой же странице.
          </p>
        </div>
      </header>

      <div className="docs-controls">
        {DOC_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={
              section.id === activeSection
                ? 'docs-button docs-button--active'
                : 'docs-button'
            }
            onClick={() => handleSectionOpen(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="docs-content">
        {DOC_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className={
              section.id === activeSection ? 'docs-section is-active' : 'docs-section'
            }
          >
            <header className="docs-section__head">
              <p className="docs-section__eyebrow">Раздел</p>
              <h2>{sectionMap[section.id]}</h2>
            </header>
            {section.id === 'llm' ? (
              <div className="docs-section__body">
                <div className="docs-figure">
                  <img
                    className="docs-figure__image"
                    src={llmScreenshot}
                    alt="Окно управления LLM интеграциями"
                  />
                  <p className="docs-figure__caption">Скриншот окна LLM</p>
                </div>
                <p className="docs-section__text">
                  В этом окне вы управляете LLM-интеграциями: смотрите список,
                  редактируете существующие и добавляете новые.
                </p>
                <div className="docs-subsection">
                  <h3>Список интеграций</h3>
                  <p className="docs-section__text">
                    В списке отображаются все подключённые интеграции. Для каждой можно:
                  </p>
                  <ul className="docs-list">
                    <li>Изменить настройки</li>
                    <li>Удалить интеграцию</li>
                  </ul>
                </div>
                <div className="docs-subsection">
                  <h3>Новая интеграция</h3>
                  <p className="docs-section__text">
                    Заполните поля, чтобы подключить LLM-провайдера:
                  </p>
                  <ul className="docs-list">
                    <li>
                      <strong>Название</strong> — удобное имя, которое вы увидите в
                      интерфейсе.
                    </li>
                    <li>
                      <strong>Провайдер</strong> — выберите вашу LLM (например, OpenAI
                      или DeepSeek).
                    </li>
                    <li>
                      <strong>Модель</strong> — точное имя модели у провайдера. Пример
                      для DeepSeek: deepseek-chat.
                    </li>
                    <li>
                      <strong>Base URL</strong> — базовый URL API провайдера. Пример
                      для DeepSeek: https://api.deepseek.com.
                    </li>
                    <li>
                      <strong>API ключ</strong> — ключ доступа, который вы получили у
                      провайдера.
                    </li>
                  </ul>
                </div>
                <div className="docs-subsection">
                  <h3>После сохранения</h3>
                  <p className="docs-section__text">
                    Интеграция сразу появится в списке — и её можно использовать для
                    запуска ревью.
                  </p>
                </div>
              </div>
            ) : section.id === 'workspace' ? (
              <div className="docs-section__body">
                <div className="docs-figure">
                  <img
                    className="docs-figure__image"
                    src={workspaceScreenshot}
                    alt="Страница рабочей зоны Workspace"
                  />
                  <p className="docs-figure__caption">Скриншот Workspace</p>
                </div>
                <p className="docs-section__text">
                  Workspace — это ваша рабочая зона. Здесь вы создаёте рабочие
                  папки, подключаете Git-интеграции и выбираете репозитории для
                  анализа.
                </p>
                <div className="docs-subsection">
                  <h3>Что можно сделать</h3>
                  <ul className="docs-list">
                    <li>Создать рабочую папку для проекта или команды.</li>
                    <li>Подключить интеграцию с GitHub или GitLab.</li>
                    <li>Добавить репозиторий из подключённой интеграции.</li>
                  </ul>
                </div>
              </div>
            ) : section.id === 'integration' ? (
              <div className="docs-section__body">
                <div className="docs-figure">
                  <img
                    className="docs-figure__image docs-figure__image--small"
                    src={integrationScreenshot}
                    alt="Окно настройки Git-интеграции"
                  />
                  <p className="docs-figure__caption">Скриншот Git-интеграции</p>
                </div>
                <p className="docs-section__text">
                  Git-интеграция нужна для связи CodeSage с вашим git-провайдером.
                  Через неё вы подключаете GitHub или GitLab и получаете доступ к
                  репозиториям.
                </p>
                <div className="docs-subsection">
                  <h3>Поля при создании</h3>
                  <ul className="docs-list">
                    <li>
                      <strong>Name</strong> — название, которое будет отображаться в
                      интерфейсе.
                    </li>
                    <li>
                      <strong>Provider</strong> — выберите нужного провайдера.
                    </li>
                    <li>
                      <strong>Base URL</strong> — укажите подходящий Base URL.
                      Примеры: GitHub — https://api.github.com, GitLab —
                      https://gitlab.com/api/v4.
                    </li>
                    <li>
                      <strong>Access token</strong> — токен доступа, который выдаёт
                      ваш git-провайдер.
                    </li>
                    <li>
                      <strong>Refresh token</strong> — токен обновления, который
                      выдаёт ваш git-провайдер (если используется).
                    </li>
                  </ul>
                </div>
              </div>
            ) : section.id === 'repository' ? (
              <div className="docs-section__body">
                <div className="docs-figure">
                  <img
                    className="docs-figure__image"
                    src={repositorySelectScreenshot}
                    alt="Выбор и добавление репозитория"
                  />
                  <p className="docs-figure__caption">
                    Выбор и добавление репозитория
                  </p>
                </div>
                <p className="docs-section__text">
                  При добавлении репозитория система показывает все проекты,
                  доступные для выбранной Git-интеграции. Выберите нужный
                  репозиторий и подтвердите добавление.
                </p>
                <div className="docs-subsection">
                  <h3>После добавления</h3>
                  <p className="docs-section__text">
                    Репозиторий появится в вашем списке, и вы сможете перейти на
                    его страницу.
                  </p>
                </div>
                <div className="docs-figure">
                  <img
                    className="docs-figure__image"
                    src={repositoryPageScreenshot}
                    alt="Страница репозитория со списком Merge Request"
                  />
                  <p className="docs-figure__caption">
                    Страница репозитория со списком Merge Request
                  </p>
                </div>
                <p className="docs-section__text">
                  На странице репозитория отображаются Merge Request этого
                  проекта — их статусы и ключевая информация для просмотра
                  ревью.
                </p>
              </div>
            ) : section.id === 'merge-request' ? (
              <div className="docs-section__body">
                <div className="docs-figure">
                  <img
                    className="docs-figure__image"
                    src={mrListScreenshot}
                    alt="Список Merge Request"
                  />
                  <p className="docs-figure__caption">Список Merge Request</p>
                </div>
                <p className="docs-section__text">
                  Здесь отображаются Merge Request выбранного репозитория. Список
                  помогает быстро оценить активность и выбрать нужный MR для
                  ревью.
                </p>
                <div className="docs-subsection">
                  <h3>Статусы MR</h3>
                  <ul className="docs-list">
                    <li>
                      <strong>Open</strong> — MR открыт и ожидает ревью/слияния.
                    </li>
                    <li>
                      <strong>Closed</strong> — MR закрыт без слияния.
                    </li>
                    <li>
                      <strong>Merged</strong> — MR успешно смёржен.
                    </li>
                  </ul>
                </div>
                <div className="docs-subsection">
                  <h3>Фильтры списка</h3>
                  <ul className="docs-list">
                    <li>
                      <strong>Status</strong> — фильтрация по состоянию (Open /
                      Closed / Merged).
                    </li>
                    <li>
                      <strong>Title</strong> — поиск по названию MR.
                    </li>
                  </ul>
                </div>

                <div className="docs-figure">
                  <img
                    className="docs-figure__image"
                    src={mrDetailScreenshot}
                    alt="Подробный просмотр Merge Request"
                  />
                  <p className="docs-figure__caption">
                    Подробный просмотр Merge Request
                  </p>
                </div>
                <p className="docs-section__text">
                  При открытии MR вы попадаете в панель управления ревью. Внутри
                  расположены несколько функциональных блоков: запуск ревью,
                  история запусков и детальные результаты.
                </p>

                <div className="docs-figure">
                  <img
                    className="docs-figure__image"
                    src={mrRunScreenshot}
                    alt="Блок запуска ревью"
                  />
                  <p className="docs-figure__caption">Блок запуска ревью</p>
                </div>
                <div className="docs-subsection">
                  <h3>Запуск ревью</h3>
                  <ul className="docs-list">
                    <li>
                      <strong>LLM интеграция</strong> — выберите провайдера, через
                      которого будет выполняться анализ.
                    </li>
                    <li>
                      <strong>Run AI Review</strong> — запускает новый прогон
                      ревью для текущего MR.
                    </li>
                    <li>
                      <strong>Re-run</strong> — повторно запускает ревью для
                      выбранного запуска из блока истории.
                    </li>
                    <li>
                      <strong>Публиковать комментарии после завершения</strong> —
                      флаг, который определяет, будут ли комментарии автоматически
                      опубликованы в MR по окончании ревью.
                    </li>
                  </ul>
                </div>

                <div className="docs-figure">
                  <img
                    className="docs-figure__image"
                    src={mrHistoryScreenshot}
                    alt="История запусков ревью"
                  />
                  <p className="docs-figure__caption">История запусков</p>
                </div>
                <div className="docs-subsection">
                  <h3>История запусков</h3>
                  <p className="docs-section__text">
                    В истории отображаются все запуски ревью, их статус и краткое
                    резюме результата. Доступные статусы:
                  </p>
                  <ul className="docs-list">
                    <li>
                      <strong>В очереди</strong> — запуск ожидает выполнения.
                    </li>
                    <li>
                      <strong>Выполняется</strong> — ревью в процессе.
                    </li>
                    <li>
                      <strong>Успешно / Готово</strong> — ревью завершено без
                      критичных ошибок.
                    </li>
                    <li>
                      <strong>Ошибка</strong> — запуск завершился ошибкой.
                    </li>
                    <li>
                      <strong>Отменено</strong> — запуск был остановлен.
                    </li>
                  </ul>
                  <p className="docs-section__text">
                    Если статус «В очереди» или «Выполняется», интерфейс
                    автоматически обновляет статус каждые 15 секунд.
                  </p>
                </div>

                <div className="docs-figure">
                  <img
                    className="docs-figure__image"
                    src={mrReviewScreenshot}
                    alt="Детали ревью"
                  />
                  <p className="docs-figure__caption">Детали ревью</p>
                </div>
                <div className="docs-subsection">
                  <h3>Детали ревью</h3>
                  <p className="docs-section__text">
                    В деталях отображается сводка и полный список комментариев:
                  </p>
                  <ul className="docs-list">
                    <li>
                      <strong>Статус</strong> — итоговый статус выбранного запуска
                      ревью.
                    </li>
                    <li>
                      <strong>Комментарии</strong> — количество найденных
                      замечаний.
                    </li>
                    <li>
                      <strong>Файлы</strong> — число файлов, затронутых
                      комментариями.
                    </li>
                    <li>
                      <strong>Серьёзные</strong> — количество критичных замечаний.
                    </li>
                  </ul>
                </div>
                <div className="docs-subsection">
                  <h3>Фильтры комментариев</h3>
                  <ul className="docs-list">
                    <li>
                      <strong>Severity</strong> — уровень серьёзности (Error,
                      Warning, Info).
                    </li>
                    <li>
                      <strong>Type</strong> — тип замечания (General, Code smell,
                      Bug, Security, Performance, Style, Tests, Documentation).
                    </li>
                    <li>
                      <strong>File</strong> — фильтр по конкретному файлу.
                    </li>
                  </ul>
                </div>
                <div className="docs-subsection">
                  <h3>Формат комментариев</h3>
                  <p className="docs-section__text">
                    Каждый комментарий содержит:
                  </p>
                  <ul className="docs-list">
                    <li>
                      <strong>Severity</strong> — уровень серьёзности.
                    </li>
                    <li>
                      <strong>Type</strong> — тип проблемы.
                    </li>
                    <li>
                      <strong>File:Line</strong> — файл и строка, к которым
                      относится замечание.
                    </li>
                    <li>
                      <strong>Статус публикации</strong> — опубликован комментарий
                      в MR или нет.
                    </li>
                    <li>
                      <strong>Текст</strong> — подробное описание проблемы и
                      рекомендации.
                    </li>
                  </ul>
                  <p className="docs-section__text">
                    Кнопка <strong>Publish to MR</strong> публикует все
                    подготовленные комментарии в Merge Request.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="docs-section__text">
                  Здесь появится руководство для блока {sectionMap[section.id]}.
                </p>
                <div className="docs-section__placeholder">
                  <p>Контент в разработке.</p>
                </div>
              </>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}

export default DocsPage
