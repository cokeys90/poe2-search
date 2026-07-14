import Modal from "./Modal.jsx";
import { IconClose, IconInfo } from "./icons.jsx";

// 출처·라이선스 안내 다이얼로그.
const REPO_URL = "https://github.com/cokeys90/poe2-search";

// title·items는 i18n 키다. 라이선스 줄처럼 번역이 없는 것은 t()가 키를 그대로 돌려준다.
const SECTIONS = [
  {
    title: "credits.copyright",
    items: [
      "credits.copyright.1",
      "credits.copyright.2",
    ],
  },
  {
    title: "credits.data",
    items: [
      "credits.data.1",
      "credits.data.2",
      "credits.data.3",
    ],
  },
  {
    title: "credits.font",
    items: [
      "Cinzel — SIL Open Font License 1.1",
      "JetBrains Mono — SIL Open Font License 1.1",
      "Material Symbols — Apache License 2.0 (Google Fonts)",
    ],
  },
  {
    title: "credits.lib",
    items: [
      "React — MIT License",
      "Vite — MIT License",
      "Tailwind CSS — MIT License",
      "Firebase SDK — Apache License 2.0",
    ],
  },
];

export default function CreditsDialog({ onClose }) {
  return (
    <Modal
      onClose={onClose}
      className="flex max-h-[80vh] w-full max-w-md flex-col rounded-md-l bg-surface-c-high shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-outline-variant px-6 py-4">
          <IconInfo width={22} className="text-primary" />
          <h2 className="text-title-l text-on-surface">{t("credits.title")}</h2>
          <button
            onClick={onClose}
            className="ml-auto rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest"
          >
            <IconClose width={20} />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          <section>
            <h3 className="mb-2 text-title-s text-primary">{t("credits.source")}</h3>
            <ul className="flex flex-col gap-1">
              <li>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-m text-primary underline underline-offset-2 transition hover:brightness-110"
                >
                  {t("credits.repo")}
                </a>
              </li>
              <li>
                <a
                  href={`${REPO_URL}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-m text-primary underline underline-offset-2 transition hover:brightness-110"
                >
                  {t("credits.issues")}
                </a>
              </li>
            </ul>
          </section>
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h3 className="mb-2 text-title-s text-primary">{t(s.title)}</h3>
              <ul className="flex flex-col gap-1">
                {s.items.map((it, i) => (
                  <li key={i} className="text-body-m leading-relaxed text-on-surface-variant">
                    {t(it)}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
    </Modal>
  );
}
