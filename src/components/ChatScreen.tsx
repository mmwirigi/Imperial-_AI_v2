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
  Globe
} from 'lucide-react';
import { ChatMessage, Site, DangerousActionType, AIModel, AIUsage, ActiveTenantContext } from '../types';

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
  }, [messages, streamingText, isStreaming]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSite || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto bg-neutral-950">
      {/* TENANT & CLIENT OPERATIONAL HIERARCHY BAR */}
      {activeTenantContext && (
        <div className="bg-neutral-950 border-b border-neutral-850 px-4 py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold">Hierarchy:</span>
            <span className="flex items-center gap-1 font-mono text-amber-400 font-bold">
              <Building2 className="w-3.5 h-3.5" />
              {activeTenantContext.organization.name}
            </span>
            <span className="text-neutral-600 font-mono">↓</span>
            <span className="flex items-center gap-1 font-mono text-amber-300 font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              {activeTenantContext.client.name}
            </span>
            <span className="text-neutral-600 font-mono">↓</span>
            <span className="flex items-center gap-1 font-mono text-emerald-400 font-medium">
              <Globe className="w-3.5 h-3.5" />
              {activeSite ? activeSite.siteName : 'None'}
            </span>
            <span className="text-neutral-600 font-mono">↓</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
              {activeTenantContext.connectionStatus}
            </span>
          </div>

          {onOpenTenantContextModal && (
            <button
              onClick={onOpenTenantContextModal}
              className="text-[11px] font-mono text-amber-400 hover:text-amber-300 underline underline-offset-2 shrink-0"
            >
              Switch Client Scope
            </button>
          )}
        </div>
      )}

      {/* MANDATORY ACTIVE SITE BANNER & MODEL SELECTOR */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
                ACTIVE SITE CONTEXT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-mono">Isolated Scope</span>
            </div>
            <div className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <span>{activeSite ? activeSite.siteName : 'No Active Site Selected'}</span>
              {activeSite && (
                <span className="text-xs text-neutral-400 font-normal font-mono hidden md:inline">
                  ({activeSite.websiteUrl})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Model Selector Button */}
          <button
            onClick={onOpenModelPicker}
            className="bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 flex items-center gap-1.5 font-mono transition-colors cursor-pointer group"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] truncate max-w-[130px] font-semibold text-neutral-100">
              {currentAiModelName}
            </span>
            {activeModel?.isFree && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                FREE
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-amber-400" />
          </button>

          {/* Switch Site Button */}
          <button
            onClick={onOpenSiteSelector}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <span>Switch Site</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!isOpenRouterConfigured ? (
        // Empty State: OpenRouter not configured
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-100">
              Connect OpenRouter to start using Imperial AI
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              An OpenRouter API key is required to stream responses from Google Gemini, DeepSeek R1, Claude, and Llama 3.3. Keys are sealed directly in Android Keystore.
            </p>
            {onNavigateToSettings && (
              <button
                onClick={onNavigateToSettings}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold rounded-lg transition-colors shadow-md cursor-pointer"
              >
                CONFIGURE AI
              </button>
            )}
          </div>
        </div>
      ) : !activeSite ? (
        // Empty State: No site selected
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-8 space-y-3">
            <Lock className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-neutral-100">Site Context Required</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              To prevent accidental cross-site tool execution, select an active client site before sending commands.
            </p>
            <button
              onClick={onOpenSiteSelector}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Select Active Site
            </button>
          </div>
        </div>
      ) : (
        // Messages Feed
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 p-8 space-y-3">
              <Sparkles className="w-8 h-8 text-amber-500/50" />
              <div className="text-sm font-semibold text-neutral-300">
                Operations Session Active for {activeSite.siteName}
              </div>
              <p className="text-xs text-neutral-400 max-w-sm">
                Ask about plugin security, sitemap verification, WooCommerce performance, or run diagnostic audits.
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
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-amber-500 text-neutral-950 font-bold text-xs'
                      : 'bg-neutral-800 text-amber-400 border border-neutral-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                    <span className="font-semibold text-neutral-300">
                      {isUser
                        ? 'OPERATOR'
                        : message.modelName
                        ? `IMPERIAL AI (${message.modelName})`
                        : 'IMPERIAL AI'}
                    </span>
                    <span>{message.timestamp}</span>
                    {message.isInterrupted && (
                      <span className="text-amber-400 font-bold">[Interrupted]</span>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-amber-500 text-neutral-950 font-medium whitespace-pre-wrap'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-100 whitespace-pre-wrap'
                    }`}
                  >
                    {message.content}

                    {/* Tool Call Preview */}
                    {message.toolCall && (
                      <div className="mt-3 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300 space-y-1">
                        <div className="text-amber-400 font-bold flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Tool: {message.toolCall.toolName}</span>
                        </div>
                        <div className="text-neutral-400">{message.toolCall.argumentsSummary}</div>
                      </div>
                    )}

                    {/* Dangerous Action Approval Prompt */}
                    {message.approvalPrompt && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400 font-mono">
                          <AlertTriangle className="w-4 h-4" />
                          <span>OPERATOR APPROVAL REQUIRED</span>
                        </div>
                        <p className="text-[11px]">{message.approvalPrompt.description}</p>
                        <div className="text-[10px] font-mono text-amber-300">
                          Resource: {message.approvalPrompt.targetResource}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Token Usage & Cost Metering Badge */}
                  {message.usage && (
                    <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-500 px-1">
                      <span>Tokens: {message.usage.totalTokens.toLocaleString()}</span>
                      <span>
                        {message.usage.estimatedCost !== null && message.usage.estimatedCost !== undefined
                          ? `Estimated Cost: $${message.usage.estimatedCost.toFixed(4)}`
                          : 'Cost: $0.00 (Free Model)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Progressive Streaming Bubble */}
          {isStreaming && (
            <div className="flex gap-3 max-w-3xl mr-auto animate-in fade-in duration-100">
              <div className="w-7 h-7 rounded-lg bg-neutral-800 text-amber-400 border border-neutral-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>

              <div className="space-y-1.5 items-start">
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                  <span className="font-semibold text-neutral-300">
                    IMPERIAL AI ({currentAiModelName})
                  </span>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-400 font-bold">Generating...</span>
                </div>

                <div className="p-3.5 rounded-xl text-xs leading-relaxed bg-neutral-900 border border-amber-500/40 text-neutral-100 whitespace-pre-wrap relative group">
                  {streamingText ? (
                    streamingText
                  ) : (
                    <span className="text-neutral-500 font-mono animate-pulse">
                      Synthesizing response through OpenRouter gateway...
                    </span>
                  )}

                  {/* Stop button inside streaming bubble */}
                  {onStopGeneration && (
                    <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-end">
                      <button
                        onClick={onStopGeneration}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[10px] font-mono font-bold border border-rose-800/40 cursor-pointer"
                      >
                        <Square className="w-2.5 h-2.5 fill-rose-300" />
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
      )}

      {/* Input Bar */}
      <div className="p-3 sm:p-4 bg-neutral-900 border-t border-neutral-800 shrink-0">
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
            className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-neutral-100 text-xs rounded-xl px-4 py-3 outline-none disabled:opacity-50 transition-colors font-sans"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-md"
              title="Stop Generation"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isOpenRouterConfigured || !inputText.trim() || !activeSite}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 font-bold rounded-xl transition-colors shrink-0 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
