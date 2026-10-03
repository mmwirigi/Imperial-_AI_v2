import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Terminal, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  ChevronDown, 
  Cpu, 
  Square, 
  Sparkles,
  Zap,
  Info,
  X,
  Building2,
  Briefcase,
  Globe,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ChatMessage, Site, DangerousActionType, AIModel, AIUsage, ActiveTenantContext } from '../types';
import { Badge, Button } from './common/UIComponents';

interface ChatScreenProps {
  activeSite: Site | null;
  activeTenantContext?: ActiveTenantContext | null;
  onOpenTenantContextModal?: () => void;
  messages: ChatMessage[];
  currentAiModelName: string;
  activeModel?: AIModel;
  isOpenRouterConfigured?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
  onOpenSiteSelector: () => void;
  onOpenModelPicker: () => void;
  onSendMessage: (text: string) => void;
  onStopGeneration?: () => void;
  onNavigateToSettings?: () => void;
  onRequestDangerousActionApproval: (actionType: DangerousActionType, target: string, desc: string) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  activeSite,
  activeTenantContext,
  onOpenTenantContextModal,
  messages,
  currentAiModelName,
  activeModel,
  isOpenRouterConfigured = false,
  isStreaming = false,
  streamingText = '',
  onOpenSiteSelector,
  onOpenModelPicker,
  onSendMessage,
  onStopGeneration,
  onNavigateToSettings,
  onRequestDangerousActionApproval,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, streamingText]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSite || isStreaming) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-full rounded-2xl border border-slate-200 shadow-2xs">
      {/* Scope Context Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                OPERATIONAL SESSION
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-700 font-mono font-semibold">Active Scope</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{activeSite ? activeSite.siteName : 'No Active Site Selected'}</span>
              {activeSite && (
                <span className="text-xs text-slate-500 font-normal font-mono hidden md:inline">
                  ({activeSite.websiteUrl})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Model Selector */}
          <button
            onClick={onOpenModelPicker}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 flex items-center gap-1.5 font-mono transition-colors group"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] truncate max-w-[130px] font-semibold text-slate-900">
              {currentAiModelName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700" />
          </button>

          {/* Switch Site Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSiteSelector}
            icon={ChevronDown}
            iconPosition="right"
          >
            Switch Site
          </Button>
        </div>
      </div>

      {/* Main Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              Autonomous Operations Session Ready
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Imperial AI can audit SEO health, inspect active plugins, generate content drafts, or execute staged WordPress mutations bound to human authorization.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.sender === 'USER';
          return (
            <div
              key={message.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs ${
                  isUser
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-amber-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="font-semibold text-slate-700">
                    {isUser
                      ? 'OPERATOR'
                      : message.modelName
                      ? `IMPERIAL AI (${message.modelName})`
                      : 'IMPERIAL AI'}
                  </span>
                  <span>{message.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-slate-950 font-medium whitespace-pre-wrap shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-2xs whitespace-pre-wrap'
                  }`}
                >
                  {message.content}

                  {/* Tool Call Preview */}
                  {message.toolCall && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] space-y-1">
                      <div className="text-amber-800 font-bold flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Tool Invocation: {message.toolCall.toolName}</span>
                      </div>
                      <div className="text-slate-600">{message.toolCall.argumentsSummary}</div>
                    </div>
                  )}

                  {/* Approval Prompt Box */}
                  {message.approvalPrompt && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs font-mono text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>OPERATOR APPROVAL REQUIRED</span>
                      </div>
                      <p className="text-[11px] text-amber-800">{message.approvalPrompt.description}</p>
                      <div className="text-[10px] font-mono text-amber-700">
                        Target Resource: {message.approvalPrompt.targetResource}
                      </div>
                    </div>
                  )}
                </div>

                {/* Token Usage */}
                {message.usage && (
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 px-1">
                    <span>Tokens: {message.usage.totalTokens.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Streaming Bubble */}
        {isStreaming && (
          <div className="flex gap-3 max-w-3xl mr-auto animate-in fade-in duration-100">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>

            <div className="space-y-1.5 items-start">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <span className="font-semibold text-slate-700">IMPERIAL AI</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-700 font-bold">Synthesizing...</span>
              </div>

              <div className="p-4 rounded-2xl text-xs leading-relaxed bg-white border border-amber-400/80 text-slate-800 shadow-2xs whitespace-pre-wrap">
                {streamingText || 'Connecting to OpenRouter gateway...'}

                {onStopGeneration && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={onStopGeneration}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold"
                    >
                      <Square className="w-2.5 h-2.5 fill-rose-600" />
                      <span>Stop Generation</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!isOpenRouterConfigured || !activeSite || isStreaming}
            placeholder={
              !isOpenRouterConfigured
                ? 'Configure OpenRouter in Settings to chat...'
                : !activeSite
                ? 'Select an active WordPress site above...'
                : `Instruct Imperial AI for ${activeSite.siteName}...`
            }
            className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900 text-xs rounded-xl px-4 py-3 outline-none disabled:opacity-50 transition-colors"
          />

          {isStreaming ? (
            <Button
              variant="danger"
              size="md"
              type="button"
              onClick={onStopGeneration}
              icon={Square}
            >
              Stop
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={!isOpenRouterConfigured || !inputText.trim() || !activeSite}
              icon={Send}
            >
              Send
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};
