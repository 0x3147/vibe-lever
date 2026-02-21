import type { PresetVendor } from "@/types/vendor";

import claudeLogo from "@/assets/images/claude-logo.svg";
import zhipuLogo from "@/assets/images/zai.svg";
import moonshotLogo from "@/assets/images/moonshot.svg";
import deepseekLogo from "@/assets/images/deepseek-color.svg";
import qwenLogo from "@/assets/images/qwen-color.svg";
import openaiLogo from "@/assets/images/openai-logo.svg";
import doubaoLogo from "@/assets/images/doubao-color.svg";
import minimaxLogo from "@/assets/images/minimax-color.svg";
import geminiLogo from "@/assets/images/gemini-color.svg";
import volcengineLogo from "@/assets/images/volcengine-color.svg";

export type Preset = PresetVendor & {
  logo: string;
  models: string[];
  modelLabels?: Record<string, string>;
  promo_url?: string;
  hot?: boolean;
  tools?: string[];
  codex_base_url?: string;
  base_urls?: { label: string; value: string; promo_url?: string }[];
};

export const PRESETS: Preset[] = [
  {
    name: "GLM", vendor_key: "zhipu", logo: zhipuLogo, hot: true,
    base_url: "https://open.bigmodel.cn/api/anthropic", model: "glm-5",
    models: ["glm-5", "glm-4.7"],
    base_urls: [
      { label: "国内站", value: "https://open.bigmodel.cn/api/anthropic", promo_url: "https://open.bigmodel.cn/glm-coding" },
      { label: "国际站", value: "https://api.z.ai/api/anthropic",         promo_url: "https://z.ai/subscribe?code=authcode_LavTZVCdFsWZ_Y71m5rTu5rXMWrkMS5WSszmJS3rDug&state=5b3494be506566b6b1aa1d3401f1d919" },
    ],
  },
  {
    name: "KIMI", vendor_key: "moonshot", logo: moonshotLogo, hot: true,
    base_url: "https://api.kimi.com/coding/", model: "kimi-for-coding",
    models: ["kimi-for-coding"],
    promo_url: "https://www.kimi.com/code?from=membership&track_id=297b4590-ab61-4327-8d36-c0ab90d24f40",
  },
  {
    name: "DeepSeek", vendor_key: "deepseek", logo: deepseekLogo,
    base_url: "https://api.deepseek.com/anthropic", model: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    modelLabels: { "deepseek-chat": "DeepSeek-V3.2", "deepseek-reasoner": "DeepSeek-V3.2(thinking)" },
  },
  {
    name: "阿里云百炼", vendor_key: "aliyun", logo: qwenLogo, hot: true,
    base_url: "https://coding.dashscope.aliyuncs.com/apps/anthropic", model: "qwen3.5-plus",
    models: ["qwen3.5-plus", "qwen3-max-2026-01-23", "qwen3-coder-next", "qwen3-coder-plus", "glm-4.7", "kimi-k2.5"],
    promo_url: "https://www.aliyun.com/benefit/scene/coding?spm=5176.42028462.nav-v2-dropdown-menu-3.d_main_4_3.5421154a9GKjn0&scm=20140722.M_10964013._.V_1&tid=J_001",
  },
  {
    name: "OpenAI", vendor_key: "openai", logo: openaiLogo,
    base_url: "https://api.openai.com/v1/", model: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o3-mini"],
  },
  {
    name: "豆包", vendor_key: "doubao", logo: doubaoLogo,
    base_url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions", model: "doubao-seed-2-0-pro-260215",
    models: ["doubao-seed-2-0-pro-260215", "doubao-seed-2-0-lite-260215", "doubao-seed-2-0-mini-260215", "doubao-seed-code-preview-latest"],
    modelLabels: {
      "doubao-seed-2-0-pro-260215":       "Doubao-Seed-2.0-pro",
      "doubao-seed-2-0-lite-260215":      "Doubao-Seed-2.0-lite",
      "doubao-seed-2-0-mini-260215":      "Doubao-Seed-2.0-mini",
      "doubao-seed-code-preview-latest":  "Doubao-Seed-2.0-Code",
    },
  },
  {
    name: "MiniMax", vendor_key: "minimax", logo: minimaxLogo, hot: true,
    base_url: "https://api.minimaxi.com/anthropic", model: "MiniMax-M2.5",
    models: ["MiniMax-M2.5"],
    promo_url: "https://platform.minimaxi.com/subscribe/coding-plan",
  },
  {
    name: "Gemini", vendor_key: "gemini", logo: geminiLogo,
    base_url: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
  {
    name: "火山方舟", vendor_key: "volcengine", logo: volcengineLogo, hot: true,
    base_url: "https://ark.cn-beijing.volces.com/api/coding", model: "doubao-seed-2.0-code",
    models: ["doubao-seed-2.0-code", "doubao-seed-code", "glm-4.7", "deepseek-v3.2", "kimi-k2-thinking", "kimi-k2.5"],
    promo_url: "https://www.volcengine.com/activity/codingplan",
  },
  {
    name: "FoxCode", vendor_key: "foxcode", logo: claudeLogo,
    tools: ["claude-code", "codex"],
    base_url: "https://code.newcli.com/claude", model: "",
    models: [],
    codex_base_url: "https://code.newcli.com/codex/v1",
    base_urls: [
      { label: "官方线路", value: "https://code.newcli.com/claude" },
      { label: "AWS线路", value: "https://code.newcli.com/claude/aws" },
      { label: "AWS思考线路", value: "https://code.newcli.com/claude/droid" },
    ],
  },
];

export const CLAUDE_CODE_EXCLUDED = ["openai", "gemini"];
