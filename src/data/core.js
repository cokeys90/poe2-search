// PoE2 경로석·서판 옵션 — 언어무관 코어 (poe2db 검증, 0.5.x)
// 표시 텍스트·검색조각·거래소명은 언어별로 src/data/locales/{lang}.json 에 있다. key로 잇는다.
// 경로석: 옵션(상단 6종) / 접두(15) / 접미(20)
// 서판: 고정(종류마다 1개) + 공통 접두(13) + 공통 접미(11) + 종류별 고유.
//       방사능(irradiated)은 고유 옵션이 없다.

export const CORE = {
  "waystone": {
    "implicit": [
      {
        "key": "ws.imp.revives",
        "numeric": true,
        "rmin": 0,
        "rmax": 6,
        "noPercent": true,
        "map_filter": "map_revives"
      },
      {
        "key": "ws.imp.item_rarity",
        "numeric": true,
        "openMax": true,
        "map_filter": "map_iir"
      },
      {
        "key": "ws.imp.pack_size",
        "numeric": true,
        "openMax": true,
        "map_filter": "map_packsize"
      },
      {
        "key": "ws.imp.rare_monsters",
        "numeric": true,
        "openMax": true,
        "map_filter": "map_rare_monsters"
      },
      {
        "key": "ws.imp.waystone_chance",
        "numeric": true,
        "openMax": true,
        "map_filter": "map_bonus"
      },
      {
        "key": "ws.imp.monster_effect",
        "numeric": true,
        "openMax": true,
        "map_filter": "map_magic_monsters"
      }
    ],
    "prefix": [
      {
        "key": "ws.pre.deal_extra_fire",
        "stat_id": "explicit.stat_92381065"
      },
      {
        "key": "ws.pre.deal_extra_cold",
        "stat_id": "explicit.stat_211727"
      },
      {
        "key": "ws.pre.deal_extra_lightning",
        "stat_id": "explicit.stat_512071314"
      },
      {
        "key": "ws.pre.monster_damage",
        "stat_id": "explicit.stat_1890519597"
      },
      {
        "key": "ws.pre.attack_cast_movement",
        "stat_id": "explicit.stat_3909654181"
      },
      {
        "key": "ws.pre.critical_hit",
        "stat_id": "explicit.stat_2753083623"
      },
      {
        "key": "ws.pre.monster_life",
        "stat_id": "explicit.stat_95249895"
      },
      {
        "key": "ws.pre.poison_hit",
        "stat_id": "explicit.stat_95221307"
      },
      {
        "key": "ws.pre.inflict_bleeding_hit",
        "stat_id": "explicit.stat_2506820610"
      },
      {
        "key": "ws.pre.break_armour_equal",
        "stat_id": "explicit.stat_1879340377"
      },
      {
        "key": "ws.pre.accuracy_rating",
        "stat_id": "explicit.stat_1588049749"
      },
      {
        "key": "ws.pre.deal_extra_chaos",
        "stat_id": "explicit.stat_2200661314"
      },
      {
        "key": "ws.pre.stun_buildup",
        "stat_id": "explicit.stat_115425161"
      },
      {
        "key": "ws.pre.fire_projectiles",
        "stat_id": "explicit.stat_1309819744"
      },
      {
        "key": "ws.pre.penetrates_elemental_resistances",
        "stat_id": "explicit.stat_1898978455"
      }
    ],
    "suffix": [
      {
        "key": "ws.suf.rare_monsters_modifiers",
        "stat_id": "explicit.stat_2550456553"
      },
      {
        "key": "ws.suf.monster_elemental_resistances",
        "stat_id": "explicit.stat_1054098949"
      },
      {
        "key": "ws.suf.monsters_armoured",
        "stat_id": "explicit.stat_2539290279"
      },
      {
        "key": "ws.suf.monsters_evasive",
        "stat_id": "explicit.stat_2570249991"
      },
      {
        "key": "ws.suf.gain_maximum_life",
        "stat_id": "explicit.stat_2887760183"
      },
      {
        "key": "ws.suf.monsters_ailment_threshold",
        "stat_id": "explicit.stat_1994551050"
      },
      {
        "key": "ws.suf.monster_ailment_application",
        "stat_id": "explicit.stat_3877264671"
      },
      {
        "key": "ws.suf.monsters_effect",
        "stat_id": "explicit.stat_1708461270"
      },
      {
        "key": "ws.suf.periodically_cursed_enfeeble",
        "stat_id": "explicit.stat_2029171424"
      },
      {
        "key": "ws.suf.periodically_temporal_chains",
        "stat_id": "explicit.stat_1629357380"
      },
      {
        "key": "ws.suf.periodically_cursed_weakness",
        "stat_id": "explicit.stat_554690751"
      },
      {
        "key": "ws.suf.patches_ignited_ground",
        "stat_id": "explicit.stat_133340941"
      },
      {
        "key": "ws.suf.patches_chilled_ground",
        "stat_id": "explicit.stat_349586058"
      },
      {
        "key": "ws.suf.patches_shocked_ground",
        "stat_id": "explicit.stat_3477720557"
      },
      {
        "key": "ws.suf.maximum_resistances",
        "stat_id": "explicit.stat_3376488707"
      },
      {
        "key": "ws.suf.gain_flask_charges",
        "stat_id": "explicit.stat_2549889921"
      },
      {
        "key": "ws.suf.recovery_rate_life",
        "stat_id": "explicit.stat_4181072906"
      },
      {
        "key": "ws.suf.cooldown_recovery_rate",
        "stat_id": ""
      },
      {
        "key": "ws.suf.take_damage_critical",
        "stat_id": "explicit.stat_337935900"
      },
      {
        "key": "ws.suf.less_effect_curses",
        "stat_id": "explicit.stat_3796523155"
      }
    ]
  },
  "tablet": {
    "unique": {
      "breach": [
        {
          "key": "tb.breach.quantity_hiveblood_found",
          "stat_id": "explicit.stat_2778285247"
        },
        {
          "key": "tb.breach.quantity_wombgifts_found",
          "stat_id": "explicit.stat_472809816"
        },
        {
          "key": "tb.breach.wombgifts_drop_higher",
          "stat_id": "explicit.stat_2889272422"
        },
        {
          "key": "tb.breach.contain_vruun_marshal",
          "stat_id": "explicit.stat_2433436306"
        },
        {
          "key": "tb.breach.spawn_when_stabilised",
          "stat_id": "explicit.stat_3762913035"
        },
        {
          "key": "tb.breach.effectiveness_rare_breach",
          "stat_id": "explicit.stat_2895378479"
        },
        {
          "key": "tb.breach.pack_size",
          "stat_id": "explicit.stat_1210760818"
        }
      ],
      "expedition": [
        {
          "key": "tb.expedition.quantity_artifacts_dropped",
          "stat_id": "explicit.stat_4219583418"
        },
        {
          "key": "tb.expedition.explosive_placement_range",
          "stat_id": "explicit.stat_1539368271"
        },
        {
          "key": "tb.expedition.expeditions_remnants",
          "stat_id": "explicit.stat_3753446846"
        },
        {
          "key": "tb.expedition.explosive_radius",
          "stat_id": "explicit.stat_3289828378"
        },
        {
          "key": "tb.expedition.quantity_logbooks_dropped",
          "stat_id": "explicit.stat_1083387327"
        },
        {
          "key": "tb.expedition.number_rare_monsters",
          "stat_id": "explicit.stat_2694800111"
        },
        {
          "key": "tb.expedition.effect_remnants",
          "stat_id": "explicit.stat_3078574625"
        },
        {
          "key": "tb.expedition.contains_monster_markers",
          "stat_id": "explicit.stat_1640965354"
        }
      ],
      "delirium": [
        {
          "key": "tb.delirium.stack_simulacrum_splinters",
          "stat_id": "explicit.stat_3836551197"
        },
        {
          "key": "tb.delirium.lasts_before_dissipating",
          "stat_id": "explicit.stat_3226351972"
        },
        {
          "key": "tb.delirium.dissipates_slower",
          "stat_id": ""
        },
        {
          "key": "tb.delirium.applies_deliriousness",
          "stat_id": "explicit.stat_1769611692"
        },
        {
          "key": "tb.delirium.monsters_pack_size",
          "stat_id": "explicit.stat_3465791711"
        },
        {
          "key": "tb.delirium.spawns_fracturing_mirrors",
          "stat_id": "explicit.stat_551040294"
        },
        {
          "key": "tb.delirium.slaying_rare_pauses",
          "stat_id": "explicit.stat_2323782229"
        },
        {
          "key": "tb.delirium.encounters_likely_spawn",
          "stat_id": "explicit.stat_3962960008"
        },
        {
          "key": "tb.delirium.spawns_mirrorshards",
          "stat_id": "explicit.stat_900933517"
        }
      ],
      "ritual": [
        {
          "key": "tb.ritual.monsters_sacrificed_grant",
          "stat_id": "explicit.stat_159726667"
        },
        {
          "key": "tb.ritual.rerolling_costs_reduced",
          "stat_id": ""
        },
        {
          "key": "tb.ritual.deferring_costs_reduced",
          "stat_id": ""
        },
        {
          "key": "tb.ritual.deferred_reappear_sooner",
          "stat_id": "explicit.stat_28208665"
        },
        {
          "key": "tb.ritual.allow_rerolling_times",
          "stat_id": "explicit.stat_120737942"
        },
        {
          "key": "tb.ritual.rerolled_cost",
          "stat_id": "explicit.stat_937291386"
        },
        {
          "key": "tb.ritual.revived_monsters_magic",
          "stat_id": "explicit.stat_1031644647"
        },
        {
          "key": "tb.ritual.revived_monsters_rare",
          "stat_id": "explicit.stat_3979184174"
        },
        {
          "key": "tb.ritual.omens",
          "stat_id": "explicit.stat_4219853180"
        }
      ],
      "overseer": [
        {
          "key": "tb.overseer.strongboxes",
          "stat_id": "explicit.stat_3240183538"
        },
        {
          "key": "tb.overseer.shrines",
          "stat_id": "explicit.stat_1468737867"
        },
        {
          "key": "tb.overseer.essences",
          "stat_id": "explicit.stat_395808938"
        },
        {
          "key": "tb.overseer.azmeri_spirits",
          "stat_id": "explicit.stat_358129101"
        },
        {
          "key": "tb.overseer.quantity_waystones_dropped",
          "stat_id": "explicit.stat_1457896329"
        },
        {
          "key": "tb.overseer.grant_experience",
          "stat_id": "explicit.stat_3860150265"
        },
        {
          "key": "tb.overseer.rarity_items_dropped",
          "stat_id": "explicit.stat_4255069232"
        },
        {
          "key": "tb.overseer.quantity_items_dropped",
          "stat_id": "explicit.stat_3119172063"
        }
      ],
      "abyss": [
        {
          "key": "tb.abyss.rare_monsters_spawned",
          "stat_id": "explicit.stat_243380454"
        },
        {
          "key": "tb.abyss.difficulty_reward_closed",
          "stat_id": "explicit.stat_360553763"
        },
        {
          "key": "tb.abyss.lead_abyssal_depths",
          "stat_id": "explicit.stat_2722831300"
        },
        {
          "key": "tb.abyss.contains_abyss",
          "stat_id": "explicit.stat_1070816711"
        },
        {
          "key": "tb.abyss.abyss_pits_likely",
          "stat_id": "explicit.stat_4256531808"
        },
        {
          "key": "tb.abyss.contain_four",
          "stat_id": "explicit.stat_2890355696"
        },
        {
          "key": "tb.abyss.abyssal_monsters_modifiers",
          "stat_id": "explicit.stat_2789248444"
        },
        {
          "key": "tb.abyss.desecrated_currency",
          "stat_id": "explicit.stat_1710200734"
        },
        {
          "key": "tb.abyss.presence_area"
        }
      ],
      "temple": [
        {
          "key": "tb.temple.add_unique_monster",
          "stat_id": "explicit.stat_3591307827"
        },
        {
          "key": "tb.temple.chests_rare",
          "stat_id": "explicit.stat_2514439422"
        },
        {
          "key": "tb.temple.gain_crystal_beacons",
          "stat_id": "explicit.stat_1940774881"
        }
      ],
      "irradiated": []
    },
    "prefix": [
      {
        "key": "tb.pre.monsters_effectiveness",
        "stat_id": "explicit.stat_2065500219"
      },
      {
        "key": "tb.pre.rarity_items_found",
        "stat_id": "explicit.stat_2306002879"
      },
      {
        "key": "tb.pre.pack_size",
        "stat_id": "explicit.stat_2017682521"
      },
      {
        "key": "tb.pre.magic_monsters",
        "stat_id": "explicit.stat_3873704640"
      },
      {
        "key": "tb.pre.number_rare_monsters",
        "stat_id": "explicit.stat_3793155082"
      },
      {
        "key": "tb.pre.monster_rarity",
        "stat_id": "explicit.stat_4142653832"
      },
      {
        "key": "tb.pre.gold_found",
        "stat_id": "explicit.stat_1276056105"
      },
      {
        "key": "tb.pre.experience_gain",
        "stat_id": "explicit.stat_57434274"
      },
      {
        "key": "tb.pre.contains_rare_chests",
        "stat_id": "explicit.stat_231864447"
      },
      {
        "key": "tb.pre.contains_essences",
        "stat_id": "explicit.stat_2777224821"
      },
      {
        "key": "tb.pre.contains_azmeri_spirits",
        "stat_id": "explicit.stat_2777224821"
      },
      {
        "key": "tb.pre.contains_rogue_exiles",
        "stat_id": "explicit.stat_2777224821"
      },
      {
        "key": "tb.pre.contains_summoning_circles",
        "stat_id": "explicit.stat_2839545956"
      }
    ],
    "suffix": [
      {
        "key": "tb.suf.quantity_waystones_found",
        "stat_id": "explicit.stat_2777224821"
      },
      {
        "key": "tb.suf.contain_shrines",
        "stat_id": "explicit.stat_689816330"
      },
      {
        "key": "tb.suf.contain_strongboxes",
        "stat_id": "explicit.stat_4279535856"
      },
      {
        "key": "tb.suf.essences",
        "stat_id": "explicit.stat_1825943485"
      },
      {
        "key": "tb.suf.azmeri_spirits",
        "stat_id": "explicit.stat_3815617979"
      },
      {
        "key": "tb.suf.rogue_exiles",
        "stat_id": "explicit.stat_1352729973"
      },
      {
        "key": "tb.suf.summoning_circle",
        "stat_id": "explicit.stat_2075129321"
      },
      {
        "key": "tb.suf.random_modifiers",
        "stat_id": "explicit.stat_588512487"
      },
      {
        "key": "tb.suf.unique_monsters_rare",
        "stat_id": "explicit.stat_3371085671"
      },
      {
        "key": "tb.suf.waystones_shrine"
      },
      {
        "key": "tb.suf.waystones_strongbox"
      }
    ],
    "implicit": {
      "irradiated": [
        {
          "key": "tb.impl.irradiated",
          "stat_id": "implicit.stat_4041853756"
        }
      ],
      "breach": [
        {
          "key": "tb.impl.breach",
          "stat_id": "implicit.stat_2219129443"
        }
      ],
      "expedition": [
        {
          "key": "tb.impl.expedition",
          "stat_id": "implicit.stat_1714888636"
        }
      ],
      "delirium": [
        {
          "key": "tb.impl.delirium",
          "stat_id": "implicit.stat_3879011313"
        }
      ],
      "ritual": [
        {
          "key": "tb.impl.ritual",
          "stat_id": "implicit.stat_3166002380"
        }
      ],
      "overseer": [
        {
          "key": "tb.impl.overseer",
          "stat_id": "implicit.stat_3376302538"
        }
      ],
      "abyss": [
        {
          "key": "tb.impl.abyss",
          "stat_id": "implicit.stat_2369421690"
        }
      ],
      "temple": [
        {
          "key": "tb.impl.temple",
          "stat_id": "implicit.stat_3035440454"
        }
      ]
    }
  }
};

// color·glow: 종류색 / 아이콘은 public/tablet/{slug}.png (slug = 이 객체의 키)
// implicit: 종류를 결정하는 고정 옵션의 거래소 stat id
export const TABLET_META = {
  "breach": {
    "color": "#b061d6",
    "glow": "rgba(176,97,214,.35)",
    "implicit": "implicit.stat_2219129443"
  },
  "expedition": {
    "color": "#d0a24a",
    "glow": "rgba(208,162,74,.35)",
    "implicit": "implicit.stat_1714888636"
  },
  "delirium": {
    "color": "#5fc7d6",
    "glow": "rgba(95,199,214,.4)",
    "implicit": "implicit.stat_3879011313"
  },
  "ritual": {
    "color": "#d05a5a",
    "glow": "rgba(208,90,90,.35)",
    "implicit": "implicit.stat_3166002380"
  },
  "overseer": {
    "color": "#e0b84a",
    "glow": "rgba(224,184,74,.45)",
    "implicit": "implicit.stat_3376302538"
  },
  "abyss": {
    "color": "#4a9b8e",
    "glow": "rgba(74,155,142,.35)",
    "implicit": "implicit.stat_2369421690"
  },
  "temple": {
    "color": "#5ac2a0",
    "glow": "rgba(90,194,160,.35)",
    "implicit": "implicit.stat_3035440454"
  },
  "irradiated": {
    "color": "#a6d13a",
    "glow": "rgba(166,209,58,.4)",
    "implicit": "implicit.stat_4041853756"
  }
};

// 방사능이 기본·첫 번째 (가장 많이 쓰는 종류)
export const TABLET_TYPES = ["irradiated","breach","expedition","delirium","ritual","overseer","abyss","temple"];
export const DEFAULT_TABLET_TYPE = "irradiated";
export const DEFAULT_TIER = "15"; // 경로석 기본 등급
export const DEFAULT_USES = "10"; // 서판 잔여 사용 횟수 기본 검색값 (안 쓴 서판)
