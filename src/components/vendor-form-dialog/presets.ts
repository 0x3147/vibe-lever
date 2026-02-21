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
import zenmuxLogo from "@/assets/images/zenmux.svg";

export type Preset = PresetVendor & {
  logo: string;
  models: string[];
  modelLabels?: Record<string, string>;
  promo_url?: string;
  promo_text?: string;
  promo_links?: { label: string; url: string }[];
  hot?: boolean;
  dark_invert?: boolean;
  tools?: string[];
  codex_base_url?: string;
  codex_model?: string;
  codex_models?: string[];
  codex_logo?: string;
  base_urls?: { label: string; value: string; promo_url?: string; promo_text?: string }[];
  model_groups?: { label: string; value: string; models: string[] }[];
};

export const PRESETS: Preset[] = [
  {
    name: "GLM", vendor_key: "zhipu", logo: zhipuLogo, hot: true, dark_invert: true,
    base_url: "https://open.bigmodel.cn/api/anthropic", model: "glm-5",
    models: [],
    model_groups: [
      { label: "快速", value: "haiku", models: ["glm-4.7"] },
      { label: "平衡", value: "sonnet", models: ["glm-4.7"] },
      { label: "极致", value: "opus",  models: ["glm-5"] },
    ],
    base_urls: [
      { label: "国内站", value: "https://open.bigmodel.cn/api/anthropic", promo_url: "https://open.bigmodel.cn/glm-coding", promo_text: "🚀 解锁智谱 GLM 旗舰能力，领取开发者专属特惠" },
      { label: "国际站", value: "https://api.z.ai/api/anthropic",         promo_url: "https://z.ai/subscribe?code=authcode_LavTZVCdFsWZ_Y71m5rTu5rXMWrkMS5WSszmJS3rDug&state=5b3494be506566b6b1aa1d3401f1d919", promo_text: "🌍 前往国际站体验无界 AI，新用户即享更多额度" },
    ],
  },
  {
    name: "KIMI", vendor_key: "moonshot", logo: moonshotLogo, hot: true, dark_invert: true,
    base_url: "https://api.kimi.com/coding/", model: "kimi-for-coding",
    models: ["kimi-for-coding"],
    promo_url: "https://www.kimi.com/code?from=membership&track_id=297b4590-ab61-4327-8d36-c0ab90d24f40",
    promo_text: "🌙 体验 Kimi 超长文本处理，点击获取编程专属折扣",
  },
  {
    name: "DeepSeek", vendor_key: "deepseek", logo: deepseekLogo,
    base_url: "https://api.deepseek.com/anthropic", model: "deepseek-chat",
    models: [],
    model_groups: [
      { label: "快速", value: "haiku",  models: ["deepseek-chat"] },
      { label: "平衡", value: "sonnet", models: ["deepseek-chat"] },
      { label: "极致", value: "opus",   models: ["deepseek-reasoner"] },
    ],
    modelLabels: { "deepseek-chat": "DeepSeek-V3.2", "deepseek-reasoner": "DeepSeek-V3.2(thinking)" },
  },
  {
    name: "阿里云百炼", vendor_key: "aliyun", logo: qwenLogo, hot: true,
    base_url: "https://coding.dashscope.aliyuncs.com/apps/anthropic", model: "qwen3.5-plus",
    models: [],
    model_groups: [
      { label: "快速", value: "haiku",  models: ["glm-4.7"] },
      { label: "平衡", value: "sonnet", models: ["qwen3.5-plus", "qwen3-coder-next", "qwen3-coder-plus"] },
      { label: "极致", value: "opus",   models: ["qwen3-max-2026-01-23", "kimi-k2.5"] },
    ],
    promo_url: "https://www.aliyun.com/benefit/scene/coding?spm=5176.42028462.nav-v2-dropdown-menu-3.d_main_4_3.5421154a9GKjn0&scm=20140722.M_10964013._.V_1&tid=J_001",
    promo_text: "☁️ 阿里云百炼大模型平台，开发者专属福利大放送",
  },
  {
    name: "OpenAI", vendor_key: "openai", logo: openaiLogo, dark_invert: true,
    base_url: "https://api.openai.com/v1/", model: "gpt-4o",
    models: [],
    model_groups: [
      { label: "快速", value: "haiku",  models: ["gpt-4o-mini"] },
      { label: "平衡", value: "sonnet", models: ["gpt-4o", "gpt-4-turbo"] },
      { label: "极致", value: "opus",   models: ["o1", "o3-mini"] },
    ],
  },
  {
    name: "豆包", vendor_key: "doubao", logo: doubaoLogo,
    base_url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions", model: "doubao-seed-2-0-pro-260215",
    models: [],
    model_groups: [
      { label: "快速", value: "haiku",  models: ["doubao-seed-2-0-lite-260215", "doubao-seed-2-0-mini-260215"] },
      { label: "平衡", value: "sonnet", models: ["doubao-seed-code-preview-latest"] },
      { label: "极致", value: "opus",   models: ["doubao-seed-2-0-pro-260215"] },
    ],
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
    promo_text: "✨ 探索 MiniMax 极致效率，点击获取尊享订阅特权",
  },
  {
    name: "Gemini", vendor_key: "gemini", logo: geminiLogo,
    base_url: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.0-flash",
    models: [],
    model_groups: [
      { label: "快速", value: "haiku",  models: ["gemini-1.5-flash", "gemini-2.0-flash"] },
      { label: "平衡", value: "sonnet", models: ["gemini-1.5-pro"] },
      { label: "极致", value: "opus",   models: ["gemini-2.0-pro"] },
    ],
  },
  {
    name: "火山方舟", vendor_key: "volcengine", logo: volcengineLogo, hot: true,
    base_url: "https://ark.cn-beijing.volces.com/api/coding", model: "doubao-seed-2.0-code",
    models: [],
    model_groups: [
      { label: "快速", value: "haiku",  models: ["doubao-seed-code", "glm-4.7"] },
      { label: "平衡", value: "sonnet", models: ["doubao-seed-2.0-code", "deepseek-v3.2"] },
      { label: "极致", value: "opus",   models: ["kimi-k2-thinking", "kimi-k2.5"] },
    ],
    promo_url: "https://www.volcengine.com/activity/codingplan",
    promo_text: "🌋 体验火山模型推理，开启开发者限时优惠",
  },
  {
    name: "ZenMux", vendor_key: "zenmux", logo: zenmuxLogo, dark_invert: true,
    base_url: "https://zenmux.ai/api/anthropic", model: "anthropic/claude-sonnet-4.6",
    models: [],
    model_groups: [
      { label: "快速", value: "haiku", models: [
        "anthropic/claude-haiku-4.5", "anthropic/claude-3.5-haiku",
        "volcengine/doubao-seed-2.0-lite", "volcengine/doubao-seed-2.0-mini",
        "z-ai/glm-4.7-flash-free", "xiaomi/mimo-v2-flash", "xiaomi/mimo-v2-flash-free",
      ]},
      { label: "平衡", value: "sonnet", models: [
        "anthropic/claude-sonnet-4.6", "anthropic/claude-sonnet-4.5", "anthropic/claude-sonnet-4", "anthropic/claude-3.7-sonnet",
        "google/gemini-3-flash-preview", "qwen/qwen3.5-plus", "qwen/qwen3-coder-plus",
        "minimax/minimax-m2.5-lightning", "volcengine/doubao-seed-2.0-code",
        "z-ai/glm-4.7", "z-ai/glm-4.7-flashx",
        "deepseek/deepseek-v3.2", "deepseek/deepseek-chat", "x-ai/grok-4.1-fast-non-reasoning",
      ]},
      { label: "极致", value: "opus", models: [
        "anthropic/claude-opus-4.6", "anthropic/claude-opus-4.5", "anthropic/claude-opus-4.1", "anthropic/claude-opus-4",
        "google/gemini-3.1-pro-preview", "google/gemini-3-pro-preview",
        "qwen/qwen3-max", "minimax/minimax-m2.5", "volcengine/doubao-seed-2.0-pro",
        "z-ai/glm-5", "x-ai/grok-4.1-fast", "moonshotai/kimi-k2.5",
      ]},
    ],
  },
  {
    name: "FoxCode", vendor_key: "foxcode", logo: claudeLogo, dark_invert: true,
    tools: ["claude-code", "codex"],
    base_url: "https://code.newcli.com/claude", model: "",
    models: [],
    codex_base_url: "https://code.newcli.com/codex/v1",
    codex_model: "gpt-5.3-codex",
    codex_models: ["gpt-5.3-codex", "gpt-5.2-codex", "gpt-5.2"],
    codex_logo: openaiLogo,
    promo_links: [
      { label: "官方地址", url: "https://foxcode.rjj.cc/dashboard" },
      { label: "foxcode发卡铺", url: "https://fk.hshwk.org/?categoryId=6" },
    ],
    base_urls: [
      { label: "官方线路", value: "https://code.newcli.com/claude" },
      { label: "AWS线路", value: "https://code.newcli.com/claude/aws" },
      { label: "AWS思考线路", value: "https://code.newcli.com/claude/droid" },
    ],
  },
];

export const CLAUDE_CODE_EXCLUDED = ["openai", "gemini"];
