// PoE2 경로석·서판 옵션 데이터 (poe2db.tw/kr 검증, 0.5.x)
// 경로석: 옵션(상단 6종) / 접두(15) / 접미(20)
// 서판: 공통 접두(13)+공통 접미(9)+종류별 고유. 방사능은 공통만.

export const DATA = {
  "waystone": {
    "implicit": [
      {
        "text": "부활 횟수",
        "frag": "부활",
        "overlap": 1,
        "map_filter": "map_revives",
        "numeric": true,
        "rmin": 0,
        "rmax": 6,
        "noPercent": true
      },
      {
        "text": "아이템 희귀도",
        "frag": "아이템",
        "overlap": 1,
        "map_filter": "map_iir",
        "numeric": true,
        "openMax": true
      },
      {
        "text": "무리 규모",
        "frag": "무리",
        "overlap": 1,
        "map_filter": "map_packsize",
        "numeric": true,
        "openMax": true
      },
      {
        "text": "몬스터 희귀도",
        "frag": "터.희",
        "overlap": 1,
        "map_filter": "map_rare_monsters",
        "numeric": true,
        "openMax": true
      },
      {
        "text": "경로석 출현 확률",
        "frag": "출현",
        "overlap": 1,
        "map_filter": "map_bonus",
        "numeric": true,
        "openMax": true
      },
      {
        "text": "몬스터 효율",
        "frag": "효율",
        "overlap": 1,
        "map_filter": "map_magic_monsters",
        "numeric": true,
        "openMax": true
      }
    ],
    "prefix": [
      {
        "text": "몬스터가 피해의 (5—9)%를 추가 화염 피해로 줌",
        "frag": "화염",
        "overlap": 1,
        "trade": "몬스터가 피해의 #%를 추가 화염 피해로 줌",
        "stat_id": "explicit.stat_92381065"
      },
      {
        "text": "몬스터가 피해의 (5—9)%를 추가 냉기 피해로 줌",
        "frag": "냉기",
        "overlap": 1,
        "trade": "몬스터가 피해의 #%를 추가 냉기 피해로 줌",
        "stat_id": "explicit.stat_211727"
      },
      {
        "text": "몬스터가 피해의 (5—9)%를 추가 번개 피해로 줌",
        "frag": "번개",
        "overlap": 1,
        "trade": "몬스터가 피해의 #%를 추가 번개 피해로 줌",
        "stat_id": "explicit.stat_512071314"
      },
      {
        "text": "몬스터 피해 (5—9)% 증가",
        "frag": "해.%",
        "overlap": 1,
        "trade": "몬스터 피해 #% 증가",
        "stat_id": "explicit.stat_1890519597"
      },
      {
        "text": "몬스터의 공격, 시전 및 이동 속도 (10—15)% 증가",
        "frag": "시전",
        "overlap": 1,
        "trade": "몬스터의 공격, 시전 및 이동 속도 #% 증가",
        "stat_id": "explicit.stat_3909654181"
      },
      {
        "text": "몬스터의 치명타 명중 확률 (80—120)% 증가",
        "frag": "치명타",
        "overlap": 1,
        "trade": "몬스터의 치명타 명중 확률 #% 증가",
        "stat_id": "explicit.stat_2753083623"
      },
      {
        "text": "몬스터의 생명력 (10—14)% 증폭",
        "frag": "생명력",
        "overlap": 1,
        "trade": "몬스터의 생명력 #% 증폭",
        "stat_id": "explicit.stat_95249895"
      },
      {
        "text": "몬스터가 명중 시 (13—19)%의 확률로 중독 유발",
        "frag": "중독",
        "overlap": 1,
        "trade": "몬스터가 명중 시 #%의 확률로 중독 유발",
        "stat_id": "explicit.stat_95221307"
      },
      {
        "text": "몬스터가 명중 시 (5—10)%의 확률로 출혈 유발",
        "frag": "출혈",
        "overlap": 1,
        "trade": "몬스터가 명중 시 #%의 확률로 출혈 유발",
        "stat_id": "explicit.stat_2506820610"
      },
      {
        "text": "몬스터가 준 물리 피해의 (15—20)%와 동일한 방어구 파괴",
        "frag": "물리",
        "overlap": 1,
        "trade": "몬스터가 준 물리 피해의 #%와 동일한 방어구 파괴",
        "stat_id": "explicit.stat_1879340377"
      },
      {
        "text": "몬스터의 정확도 (10—20)% 증가",
        "frag": "정확",
        "overlap": 1,
        "trade": "몬스터의 정확도 #% 증가",
        "stat_id": "explicit.stat_1588049749"
      },
      {
        "text": "몬스터가 피해의 (5—9)%를 추가 카오스 피해로 줌",
        "frag": "카오스",
        "overlap": 1,
        "trade": "몬스터가 피해의 #%를 추가 카오스 피해로 줌",
        "stat_id": "explicit.stat_2200661314"
      },
      {
        "text": "몬스터의 기절 축적 (50—60)% 증가",
        "frag": "기절",
        "overlap": 1,
        "trade": "몬스터의 기절 축적 #% 증가",
        "stat_id": "explicit.stat_115425161"
      },
      {
        "text": "몬스터가 투사체 2개 추가 발사",
        "frag": "발사",
        "overlap": 1,
        "trade": "몬스터가 투사체 #개 추가 발사",
        "stat_id": "explicit.stat_1309819744"
      },
      {
        "text": "몬스터 피해가 (6—8)%의 원소 저항 관통",
        "frag": "원소",
        "overlap": 1,
        "trade": "몬스터 피해가 #%의 원소 저항 관통",
        "stat_id": "explicit.stat_1898978455"
      }
    ],
    "suffix": [
      {
        "text": "희귀 몬스터가 속성 부여 1개 추가 보유",
        "frag": "희귀",
        "overlap": 1,
        "trade": "희귀 몬스터가 속성 부여 #개 추가 보유",
        "stat_id": "explicit.stat_2550456553"
      },
      {
        "text": "몬스터의 원소 저항 +(20—24)%",
        "frag": "소.저",
        "overlap": 1,
        "trade": "몬스터의 원소 저항 +#%",
        "stat_id": "explicit.stat_1054098949"
      },
      {
        "text": "몬스터가 장갑을 두른 몬스터",
        "frag": "장갑",
        "overlap": 1,
        "trade": "몬스터가 장갑을 두른 몬스터",
        "stat_id": "explicit.stat_2539290279"
      },
      {
        "text": "몬스터가 회피하는 몬스터",
        "frag": "회피",
        "overlap": 1,
        "trade": "몬스터가 회피하는 몬스터",
        "stat_id": "explicit.stat_2570249991"
      },
      {
        "text": "몬스터가 최대 생명력의 (12—25)%를 추가 에너지 보호막 최대치로 획득",
        "frag": "생.*최",
        "overlap": 1,
        "trade": "몬스터가 최대 생명력의 #%를 추가 에너지 보호막 최대치로 획득",
        "stat_id": "explicit.stat_2887760183"
      },
      {
        "text": "몬스터의 상태 이상 한계치 (30—39)% 증가",
        "frag": "한계치",
        "overlap": 1,
        "trade": "몬스터의 상태 이상 한계치 #% 증가",
        "stat_id": "explicit.stat_1994551050"
      },
      {
        "text": "몬스터의 원소 상태 이상 적용 (60—79)% 증가",
        "frag": "원.*이",
        "overlap": 1,
        "trade": "몬스터의 원소 상태 이상 적용 #% 증가",
        "stat_id": "explicit.stat_3877264671"
      },
      {
        "text": "몬스터의 효과 범위 50% 증가",
        "frag": "범위",
        "overlap": 1,
        "trade": "몬스터의 효과 범위 #% 증가",
        "stat_id": "explicit.stat_1708461270"
      },
      {
        "text": "지역이 쇠약화 저주에 걸림",
        "frag": "쇠약화",
        "overlap": 1,
        "trade": "지역이 쇠약화 저주에 걸림",
        "stat_id": "explicit.stat_2029171424"
      },
      {
        "text": "지역이 시간의 사슬 저주에 걸림",
        "frag": "사슬",
        "overlap": 1,
        "trade": "지역이 시간의 사슬 저주에 걸림",
        "stat_id": "explicit.stat_1629357380"
      },
      {
        "text": "지역이 원소 약화 저주에 걸림",
        "frag": "원.*약",
        "overlap": 1,
        "trade": "지역이 원소 약화 저주에 걸림",
        "stat_id": "explicit.stat_554690751"
      },
      {
        "text": "지역에 점화 지대 존재",
        "frag": "점화",
        "overlap": 1,
        "trade": "지역에 점화 지대 존재",
        "stat_id": "explicit.stat_133340941"
      },
      {
        "text": "지역에 얼음 지대 존재",
        "frag": "얼음",
        "overlap": 1,
        "trade": "지역에 얼음 지대 존재",
        "stat_id": "explicit.stat_349586058"
      },
      {
        "text": "지역에 감전 지대 존재",
        "frag": "감전",
        "overlap": 1,
        "trade": "지역에 감전 지대 존재",
        "stat_id": "explicit.stat_3477720557"
      },
      {
        "text": "플레이어 저항 최대치 (-4—-3)%",
        "frag": "저.*최",
        "overlap": 1,
        "trade": "플레이어 저항 최대치 #%",
        "stat_id": "explicit.stat_3376488707"
      },
      {
        "text": "플레이어의 플라스크 충전량 (20—24)% 감소",
        "frag": "충전량",
        "overlap": 1,
        "trade": "플레이어의 플라스크 충전량 #% 감소",
        "stat_id": "explicit.stat_2549889921"
      },
      {
        "text": "플레이어의 생명력 및 에너지 보호막 회복 속도 (20—29)% 감폭",
        "frag": "생.*회",
        "overlap": 1,
        "trade": "플레이어의 생명력 및 에너지 보호막 회복 속도 #% 감폭",
        "stat_id": "explicit.stat_4181072906"
      },
      {
        "text": "플레이어의 재사용 대기시간 회복 속도 (15—20)% 감폭",
        "frag": "재사용",
        "overlap": 1,
        "stat_id": ""
      },
      {
        "text": "몬스터가 치명타 명중으로 받는 추가 피해 (15—19)% 감소",
        "frag": "명중",
        "overlap": 1,
        "trade": "몬스터가 치명타 명중으로 받는 추가 피해 #% 감소",
        "stat_id": "explicit.stat_337935900"
      },
      {
        "text": "몬스터에게 적용되는 저주 효과 (20—30)% 감폭",
        "frag": "저.*효",
        "overlap": 1,
        "trade": "몬스터에게 적용되는 저주 효과 #% 감폭",
        "stat_id": "explicit.stat_3796523155"
      }
    ]
  },
  "tablet": {
    "common_prefix": [
      {
        "text": "몬스터의 효율 (10—15)% 증가",
        "frag": "몬.*율",
        "overlap": 2,
        "trade": "몬스터의 효율 #% 증가",
        "stat_id": "explicit.stat_2065500219"
      },
      {
        "text": "지도에서 발견하는 아이템 희귀도 (8—12)% 증가",
        "frag": "템.희",
        "overlap": 1,
        "trade": "지도에서 발견하는 아이템 희귀도 #% 증가",
        "stat_id": "explicit.stat_2306002879"
      },
      {
        "text": "지도 내 무리 규모 (5—7)% 증가",
        "frag": "내.무",
        "overlap": 1,
        "trade": "지도 내 무리 규모 #% 증가",
        "stat_id": "explicit.stat_2017682521"
      },
      {
        "text": "지도에 마법 몬스터 (30—40)% 증가",
        "frag": "에.마",
        "overlap": 1,
        "trade": "지도에 마법 몬스터 #% 증가",
        "stat_id": "explicit.stat_3873704640"
      },
      {
        "text": "지도에 희귀 몬스터 수 (25—35)% 증가",
        "frag": "귀.*수",
        "overlap": 2,
        "trade": "지도에 희귀 몬스터 수 #% 증가",
        "stat_id": "explicit.stat_3793155082"
      },
      {
        "text": "지도의 몬스터 희귀도 (15—20)% 증가",
        "frag": "지.의",
        "overlap": 1,
        "trade": "지도의 몬스터 희귀도 #% 증가",
        "stat_id": "explicit.stat_4142653832"
      },
      {
        "text": "지도에서 발견하는 골드 (25—35)% 증가",
        "frag": "골드",
        "overlap": 1,
        "trade": "지도에서 발견하는 골드 #% 증가(골드 더미)",
        "stat_id": "explicit.stat_1276056105"
      },
      {
        "text": "지도 내 경험치 획득 (12—18)% 증가",
        "frag": "내.경",
        "overlap": 1,
        "trade": "지도 내 경험치 획득 #% 증가",
        "stat_id": "explicit.stat_57434274"
      },
      {
        "text": "지도에 희귀 상자 (2—3)개 추가 등장",
        "frag": "희.*상",
        "overlap": 1,
        "trade": "지도에 희귀 상자 1개 추가 등장",
        "stat_id": "explicit.stat_231864447"
      },
      {
        "text": "지도에 에센스 1개 추가 등장 / 지도에서 발견하는 경로석 수량 % 증가",
        "frag": "센.*경",
        "overlap": 1,
        "trade": "지도에서 발견하는 경로석 수량 #% 증가",
        "stat_id": "explicit.stat_2777224821"
      },
      {
        "text": "지도에서 발견하는 경로석 수량 % 증가 / 지도에 아즈메리 혼백 1개 추가 등장",
        "frag": "경.*아",
        "overlap": 1,
        "trade": "지도에서 발견하는 경로석 수량 #% 증가",
        "stat_id": "explicit.stat_2777224821"
      },
      {
        "text": "지도에서 발견하는 경로석 수량 % 증가 / 지도에 탈주 유배자 추가 1명이 서식",
        "frag": "명이",
        "overlap": 1,
        "trade": "지도에서 발견하는 경로석 수량 #% 증가",
        "stat_id": "explicit.stat_2777224821"
      },
      {
        "text": "지도에 소환의 원 1개 추가 등장",
        "frag": "원.개",
        "overlap": 1,
        "trade": "지도에 소환의 원 1개 추가 등장",
        "stat_id": "explicit.stat_2839545956"
      }
    ],
    "common_suffix": [
      {
        "text": "지도에서 발견하는 경로석 수량 (30—40)% 증가",
        "frag": "견.*경",
        "overlap": 4,
        "trade": "지도에서 발견하는 경로석 수량 #% 증가",
        "stat_id": "explicit.stat_2777224821"
      },
      {
        "text": "지도에 성소가 등장할 확률 #% 증가 (무리 규모 감소, 경로석 수량 증가, 성소 추가)",
        "frag": "성.가",
        "overlap": 1,
        "trade": "지도에 성소가 등장할 확률 #% 증가",
        "stat_id": "explicit.stat_689816330"
      },
      {
        "text": "지도에 금고가 등장할 확률 #% 증가 (무리 규모 감소, 경로석 수량 증가, 금고 추가)",
        "frag": "금.가",
        "overlap": 1,
        "trade": "지도에 금고가 등장할 확률 #% 증가",
        "stat_id": "explicit.stat_4279535856"
      },
      {
        "text": "지도에 에센스가 등장할 확률 (70—100)% 증가",
        "frag": "센.가",
        "overlap": 1,
        "trade": "지도에 에센스가 등장할 확률 #% 증가",
        "stat_id": "explicit.stat_1825943485"
      },
      {
        "text": "지도에 아즈메리 혼백이 등장할 확률 (70—100)% 증가",
        "frag": "혼.이",
        "overlap": 1,
        "trade": "지도에 아즈메리 혼백이 등장할 확률 #% 증가",
        "stat_id": "explicit.stat_3815617979"
      },
      {
        "text": "지도에 탈주 유배자가 등장할 확률 (70—100)% 증가",
        "frag": "배.가",
        "overlap": 1,
        "trade": "지도에 탈주 유배자가 등장할 확률 #% 증가",
        "stat_id": "explicit.stat_1352729973"
      },
      {
        "text": "지도에 소환의 원이 등장할 확률 (70—100)% 증가",
        "frag": "원이",
        "overlap": 1,
        "trade": "지도에 소환의 원이 등장할 확률 #% 증가",
        "stat_id": "explicit.stat_2075129321"
      },
      {
        "text": "지도에 무작위 속성 부여 (1—2)개 추가",
        "frag": "부여",
        "overlap": 1,
        "trade": "지도에 무작위 속성 부여 #개 추가",
        "stat_id": "explicit.stat_588512487"
      },
      {
        "text": "고유 몬스터가 속성 1개 추가 보유",
        "frag": "고.*속",
        "overlap": 1,
        "trade": "고유 몬스터가 속성 #개 추가 보유",
        "stat_id": "explicit.stat_3371085671"
      }
    ],
    "unique": {
      "균열": [
        {
          "text": "지도에서 발견하는 벌레집 피 수량 (30—60)% 증가",
          "frag": "벌레집",
          "overlap": 1,
          "trade": "지도에서 발견하는 벌레집 피 수량 #% 증가",
          "stat_id": "explicit.stat_2778285247"
        },
        {
          "text": "지도에서 발견하는 생명의 결실 수량 (30—60)% 증가",
          "frag": "결.*수",
          "overlap": 1,
          "trade": "지도에서 발견하는 생명의 결실 수량 #% 증가",
          "stat_id": "explicit.stat_472809816"
        },
        {
          "text": "지도에서 생명의 결실이 (10—30)% 확률로 1레벨 높게 떨어짐",
          "frag": "레벨",
          "overlap": 1,
          "trade": "지도에서 생명의 결실이 #% 확률로 1레벨 높게 떨어짐",
          "stat_id": "explicit.stat_2889272422"
        },
        {
          "text": "지도 내 균열에 제쉬트의 총사령관 브룬이 등장할 확률 (20—50)% 증가",
          "frag": "브룬",
          "overlap": 1,
          "trade": "지도 내 균열에 제쉬트의 총사령관 브룬이 등장할 확률 #% 증가",
          "stat_id": "explicit.stat_2433436306"
        },
        {
          "text": "지도 내 불안정한 균열이 안정화되면 희귀 몬스터 (1—3)마리를 추가로 생성함",
          "frag": "불안정",
          "overlap": 1,
          "trade": "지도 내 불안정한 균열이 안정화되면 희귀 몬스터 1마리를 추가로 생성함",
          "stat_id": "explicit.stat_3762913035"
        },
        {
          "text": "지도 내 희귀 균열 몬스터의 효율 (5—20)% 증가",
          "frag": "희.*균",
          "overlap": 1,
          "trade": "지도 내 희귀 균열 몬스터의 효율 #% 증가",
          "stat_id": "explicit.stat_2895378479"
        },
        {
          "text": "지도 내 균열의 무리 규모 (5—15)% 증가",
          "frag": "균.*무",
          "overlap": 1,
          "trade": "지도 내 균열의 무리 규모 #% 증가",
          "stat_id": "explicit.stat_1210760818"
        }
      ],
      "탐험": [
        {
          "text": "지도 내 몬스터가 떨어뜨리는 탐험 유물의 수량 (15—30)% 증가",
          "frag": "유물",
          "overlap": 1,
          "trade": "지도 내 몬스터가 떨어뜨리는 탐험 유물의 수량 #% 증가",
          "stat_id": "explicit.stat_4219583418"
        },
        {
          "text": "지도 내 탐험 폭발물 설치 범위 (15—30)% 증가",
          "frag": "설치",
          "overlap": 1,
          "trade": "지도 내 탐험 폭발물 설치 범위 #% 증가",
          "stat_id": "explicit.stat_1539368271"
        },
        {
          "text": "지도 내 탐험의 유적 +(1—2)개",
          "frag": "탐.의",
          "overlap": 1,
          "trade": "지도 내 탐험의 유적 #개",
          "stat_id": "explicit.stat_3753446846"
        },
        {
          "text": "지도 내 탐험 폭발 반경 (15—30)% 증가",
          "frag": "반경",
          "overlap": 1,
          "trade": "지도 내 탐험 폭발 반경 #% 증가",
          "stat_id": "explicit.stat_3289828378"
        },
        {
          "text": "지도 내 룬 몬스터가 떨어뜨리는 탐험 일지의 수량 (15—30)% 증가",
          "frag": "일지",
          "overlap": 1,
          "trade": "지도 내 룬 몬스터가 떨어뜨리는 탐험 일지의 수량 #% 증가",
          "stat_id": "explicit.stat_1083387327"
        },
        {
          "text": "지도 내 희귀 탐험 몬스터 수 (25—40)% 증가",
          "frag": "희.*탐",
          "overlap": 1,
          "trade": "지도 내 희귀 탐험 몬스터 수 #% 증가",
          "stat_id": "explicit.stat_2694800111"
        },
        {
          "text": "지도 내 탐험 유적의 효과 (12—18)% 증가",
          "frag": "효과",
          "overlap": 1,
          "trade": "지도 내 탐험 유적의 효과 #% 증가",
          "stat_id": "explicit.stat_3078574625"
        },
        {
          "text": "지도에 룬 몬스터 표시물 수량 (15—30)% 증가",
          "frag": "표시물",
          "overlap": 1,
          "trade": "지도에 룬 몬스터 표시물 수량 #% 증가",
          "stat_id": "explicit.stat_1640965354"
        }
      ],
      "환영": [
        {
          "text": "지도에서 발견하는 복제된 영토 파편의 중첩 개수 (15—30)% 증가",
          "frag": "복제",
          "overlap": 1,
          "trade": "지도에서 발견하는 복제된 영토 파편의 중첩 개수 #% 증가",
          "stat_id": "explicit.stat_3836551197"
        },
        {
          "text": "지도 내 환영 안개가 (6—12)초 추가로 지속되고 사라짐",
          "frag": "지속되고",
          "overlap": 1,
          "trade": "지도 내 환영 안개가 #초 추가로 지속되고 사라짐",
          "stat_id": "explicit.stat_3226351972"
        },
        {
          "text": "지도 내 환영 안개가 (20—30)% 더 느리게 사라짐",
          "frag": "느리게",
          "overlap": 1,
          "trade": "",
          "stat_id": ""
        },
        {
          "text": "지도 내 환영 안개가 플레이어에게 적용하는 환영 (15—30)% 증가",
          "frag": "가.플",
          "overlap": 1,
          "trade": "지도 내 환영 안개가 플레이어에게 적용하는 환영 #% 증가",
          "stat_id": "explicit.stat_1769611692"
        },
        {
          "text": "지도 내 환영 몬스터의 무리 규모 (15—30)% 증가",
          "frag": "환.*무",
          "overlap": 1,
          "trade": "지도 내 환영 몬스터의 무리 규모 #% 증가",
          "stat_id": "explicit.stat_3465791711"
        },
        {
          "text": "지도 내 환영 안개에서 생성되는 분열의 거울 (15—30)% 증가",
          "frag": "분열",
          "overlap": 1,
          "trade": "지도 내 환영 안개에서 생성되는 분열의 거울 #% 증가",
          "stat_id": "explicit.stat_551040294"
        },
        {
          "text": "지도 내 희귀 몬스터 처치 시 환영 거울 타이머 (3—5)초 동안 일시 정지",
          "frag": "처치",
          "overlap": 1,
          "trade": "지도 내 희귀 몬스터 처치 시 환영 거울 타이머 1초 동안 일시 정지",
          "stat_id": "explicit.stat_2323782229"
        },
        {
          "text": "지도 내 환영 인카운터의 고유 보스 등장 확률 (15—30)% 증폭",
          "frag": "인카운터",
          "overlap": 1,
          "trade": "지도 내 환영 인카운터의 고유 보스 등장 확률 #% 증폭",
          "stat_id": "explicit.stat_3962960008"
        },
        {
          "text": "지도 내 환영 안개에서 생성되는 거울 파편 (12—26)% 증가",
          "frag": "환.*파",
          "overlap": 1,
          "trade": "지도 내 환영 안개에서 생성되는 거울 파편 #% 증가",
          "stat_id": "explicit.stat_900933517"
        }
      ],
      "의식": [
        {
          "text": "지도 내 의식 제단에서 희생되는 몬스터가 주는 공물 점수 (18—30)% 증가",
          "frag": "희생",
          "overlap": 1,
          "trade": "지도 내 의식 제단에서 희생되는 몬스터가 주는 공물 점수 #% 증가",
          "stat_id": "explicit.stat_159726667"
        },
        {
          "text": "지도 내 의식 제단에서 헌정품을 무작위 변경하는 데 소모되는 공물 점수 (20—30)% 감소",
          "frag": "을.무",
          "overlap": 1,
          "trade": "",
          "stat_id": ""
        },
        {
          "text": "지도 내 의식 제단에서 헌정품을 보류하는 데 소모되는 공물 점수 (20—30)% 감소",
          "frag": "헌.*보",
          "overlap": 1,
          "trade": "",
          "stat_id": ""
        },
        {
          "text": "지도 내 의식 제단에 보류한 헌정품이 다시 등장하는 시간 (25—40)% 가속",
          "frag": "시간",
          "overlap": 1,
          "trade": "지도 내 의식 제단에 보류한 헌정품이 다시 등장하는 시간 #% 가속",
          "stat_id": "explicit.stat_28208665"
        },
        {
          "text": "지도 내 의식 제단이 헌정품 무작위 변경 추가 (1—3)회 허용",
          "frag": "허용",
          "overlap": 1,
          "trade": "지도 내 의식 제단이 헌정품 무작위 변경 추가 1회 허용",
          "stat_id": "explicit.stat_120737942"
        },
        {
          "text": "지도 내 의식 제단에서 무작위 변경된 헌정품이 (3—6)%의 확률로 공물 점수를 소모하지 않음",
          "frag": "않음",
          "overlap": 1,
          "trade": "지도 내 의식 제단에서 무작위 변경된 헌정품이 #%의 확률로 공물 점수를 소모하지 않음",
          "stat_id": "explicit.stat_937291386"
        },
        {
          "text": "지도 내 의식 제단에서 되살아난 몬스터가 마법 등급일 확률 (35—70)% 증가",
          "frag": "의.*마",
          "overlap": 1,
          "trade": "지도 내 의식 제단에서 되살아난 몬스터가 마법 등급일 확률 #% 증가",
          "stat_id": "explicit.stat_1031644647"
        },
        {
          "text": "지도 내 의식 제단에서 되살아난 몬스터가 희귀 등급일 확률 (25—40)% 증가",
          "frag": "식.*귀",
          "overlap": 1,
          "trade": "지도 내 의식 제단에서 되살아난 몬스터가 희귀 등급일 확률 #% 증가",
          "stat_id": "explicit.stat_3979184174"
        },
        {
          "text": "지도 내 의식 헌정품이 징조일 확률 (35—70)% 증가",
          "frag": "징조일",
          "overlap": 1,
          "trade": "지도 내 의식 헌정품이 징조일 확률 #% 증가",
          "stat_id": "explicit.stat_4219853180"
        }
      ],
      "감독관": [
        {
          "text": "지도에 금고 (1—2)개 추가 등장",
          "frag": "고.개",
          "overlap": 1,
          "trade": "지도에 금고 #개 추가 등장",
          "stat_id": "explicit.stat_3240183538"
        },
        {
          "text": "지도에 성소 (1—2)개 추가 등장",
          "frag": "소.개",
          "overlap": 1,
          "trade": "지도에 성소 1개 추가 등장",
          "stat_id": "explicit.stat_1468737867"
        },
        {
          "text": "지도에 에센스 (1—2)개 추가 등장",
          "frag": "센.*개",
          "overlap": 2,
          "trade": "지도에 에센스 1개 추가 등장",
          "stat_id": "explicit.stat_395808938"
        },
        {
          "text": "지도에 아즈메리 혼백 (1—2)개 추가 등장",
          "frag": "리.*개",
          "overlap": 2,
          "trade": "지도에 아즈메리 혼백 #개 추가 등장",
          "stat_id": "explicit.stat_358129101"
        },
        {
          "text": "지도 보스가 떨어뜨리는 경로석의 수량 (18—30)% 증가",
          "frag": "떨.*경",
          "overlap": 1,
          "trade": "지도 보스가 떨어뜨리는 경로석의 수량 #% 증가",
          "stat_id": "explicit.stat_1457896329"
        },
        {
          "text": "지도 보스가 주는 경험치 (40—80)% 증폭",
          "frag": "보.*험",
          "overlap": 1,
          "trade": "지도 보스가 주는 경험치 #% 증폭",
          "stat_id": "explicit.stat_3860150265"
        },
        {
          "text": "지도 보스가 떨어뜨리는 아이템의 희귀도 (35—60)% 증가",
          "frag": "보.*희",
          "overlap": 1,
          "trade": "지도 보스가 떨어뜨리는 아이템의 희귀도 #% 증가",
          "stat_id": "explicit.stat_4255069232"
        },
        {
          "text": "지도 보스가 떨어뜨리는 아이템의 수량 (13—20)% 증가",
          "frag": "아.*수",
          "overlap": 1,
          "trade": "지도 보스가 떨어뜨리는 아이템의 수량 #% 증가",
          "stat_id": "explicit.stat_3119172063"
        }
      ],
      "심연": [
        {
          "text": "지도 내 심연에 추가 희귀 몬스터 (1—2)마리 생성",
          "frag": "심.*희",
          "overlap": 1,
          "trade": "지도 내 심연에 추가 희귀 몬스터 #마리 생성",
          "stat_id": "explicit.stat_243380454"
        },
        {
          "text": "닫은 구덩이의 수에 따라 지도 내 심연 몬스터의 난이도와 보상 증가",
          "frag": "닫은",
          "overlap": 1,
          "trade": "닫은 구덩이의 수에 따라 지도 내 심연 몬스터의 난이도와 보상 증가",
          "stat_id": "explicit.stat_360553763"
        },
        {
          "text": "지도 내 심연이 심연 지하로 이어질 확률 (10—20)% 증가",
          "frag": "지하",
          "overlap": 1,
          "trade": "지도 내 심연이 심연 지하로 이어질 확률 #% 증가",
          "stat_id": "explicit.stat_2722831300"
        },
        {
          "text": "지도에 심연 1개 추가 등장",
          "frag": "에.심",
          "overlap": 1,
          "trade": "지도에 심연 1개 추가 등장",
          "stat_id": "explicit.stat_1070816711"
        },
        {
          "text": "지도 내 심연 구덩이에서 보상을 제공할 확률 2배",
          "frag": "제공",
          "overlap": 1,
          "trade": "지도 내 심연 구덩이에서 보상을 제공할 확률 2배",
          "stat_id": "explicit.stat_4256531808"
        },
        {
          "text": "지도에 (20—40)% 확률로 심연 4개 추가 등장",
          "frag": "에.확",
          "overlap": 1,
          "trade": "지도에 #% 확률로 심연 4개 추가 등장",
          "stat_id": "explicit.stat_2890355696"
        },
        {
          "text": "지도 내 심연 몬스터가 심연 속성을 보유할 확률 (20—30)% 증가",
          "frag": "심.*속",
          "overlap": 1,
          "trade": "지도 내 심연 몬스터가 심연 속성을 보유할 확률 #% 증가",
          "stat_id": "explicit.stat_2789248444"
        },
        {
          "text": "지도 내 심연에서 훼손된 화폐가 등장할 확률 (20—30)% 증가",
          "frag": "훼손",
          "overlap": 1,
          "trade": "지도 내 심연에서 훼손된 화폐가 등장할 확률 #% 증가",
          "stat_id": "explicit.stat_1710200734"
        }
      ],
      "사원": [
        {
          "text": "(10—25)% 확률로 지도에 바알 등대 고유 몬스터 추가",
          "frag": "바.*고",
          "overlap": 1,
          "trade": "#% 확률로 지도에 바알 등대 고유 몬스터 추가",
          "stat_id": "explicit.stat_3591307827"
        },
        {
          "text": "지도 내 바알 등대 상자가 희귀 등급일 확률 (30—60)% 증가",
          "frag": "바.*상",
          "overlap": 1,
          "trade": "지도 내 바알 등대 상자가 희귀 등급일 확률 #% 증가",
          "stat_id": "explicit.stat_2514439422"
        },
        {
          "text": "지도 내 바알 등대에서 (5—10)% 확률로 수정 1개 추가 획득",
          "frag": "수정",
          "overlap": 1,
          "trade": "지도 내 바알 등대에서 #% 확률로 수정 1개 추가 획득",
          "stat_id": "explicit.stat_1940774881"
        }
      ],
      "방사능": []
    }
  }
};

export const TABLET_META = {
  // color: 종류색 / glow / slug: public/tablet/{slug}.png (poe2wiki 인벤토리 아이콘)
  "균열":   { color:"#b061d6", glow:"rgba(176,97,214,.35)", slug:"breach" },
  "탐험":   { color:"#d0a24a", glow:"rgba(208,162,74,.35)", slug:"expedition" },
  "환영":   { color:"#5fc7d6", glow:"rgba(95,199,214,.4)",  slug:"delirium" },
  "의식":   { color:"#d05a5a", glow:"rgba(208,90,90,.35)",  slug:"ritual" },
  "감독관": { color:"#e0b84a", glow:"rgba(224,184,74,.45)", slug:"overseer" },
  "심연":   { color:"#4a9b8e", glow:"rgba(74,155,142,.35)", slug:"abyss" },
  "사원":   { color:"#5ac2a0", glow:"rgba(90,194,160,.35)", slug:"temple" },
  "방사능": { color:"#a6d13a", glow:"rgba(166,209,58,.4)",  slug:"irradiated" },
};

// 방사능이 기본·첫 번째 (가장 많이 쓰는 종류)
export const TABLET_TYPES = ["방사능", "균열", "탐험", "환영", "의식", "감독관", "심연", "사원"];
export const DEFAULT_TABLET_TYPE = "방사능";
export const DEFAULT_TIER = "15"; // 경로석 기본 등급
