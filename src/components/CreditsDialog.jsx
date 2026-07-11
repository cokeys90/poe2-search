import Modal from "./Modal.jsx";
import { IconClose, IconInfo } from "./icons.jsx";

// 출처·라이선스 안내 다이얼로그.
const SECTIONS = [
  {
    title: "게임 저작권",
    items: [
      "Path of Exile 2 및 모든 아이템·화폐 이미지·명칭의 저작권은 Grinding Gear Games에 있습니다.",
      "본 사이트는 비공식 팬 제작 도구이며 GGG와 무관합니다.",
    ],
  },
  {
    title: "데이터 · 이미지 출처",
    items: [
      "옵션 데이터 및 화폐 이미지: poe2db.tw",
      "참고 정규식 엔진: poe2.re (veiset/poe2.re)",
    ],
  },
  {
    title: "폰트",
    items: [
      "Cinzel — SIL Open Font License 1.1",
      "JetBrains Mono — SIL Open Font License 1.1",
      "Material Symbols — Apache License 2.0 (Google Fonts)",
    ],
  },
  {
    title: "라이브러리",
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
          <h2 className="text-title-l text-on-surface">정보 · 출처</h2>
          <button
            onClick={onClose}
            className="ml-auto rounded-full p-1 text-on-surface-variant hover:bg-surface-c-highest"
          >
            <IconClose width={20} />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h3 className="mb-2 text-title-s text-primary">{s.title}</h3>
              <ul className="flex flex-col gap-1">
                {s.items.map((it, i) => (
                  <li key={i} className="text-body-m leading-relaxed text-on-surface-variant">
                    {it}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
    </Modal>
  );
}
