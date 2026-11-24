import React, { useState } from 'react';
import { X, BookOpen, Shield, Sparkles, Award, Lightbulb, ChevronRight } from 'lucide-react';
import { GAME_RULES_DATA } from '@shared/gameFramework/GameRulesData.js';
import { GAME_COVERS } from './GameCard';

export const GameGuideModal = ({ gameId, isOpen, onClose }) => {
  if (!isOpen || !gameId) return null;

  const guide = GAME_RULES_DATA[gameId] || GAME_RULES_DATA.chess;
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'pieces' | 'special' | 'tips'

  const coverUrl = GAME_COVERS[gameId] || GAME_COVERS.chess;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl glass-panel border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col bg-slate-900/95">
        
        {/* Banner with Cover Artwork */}
        <div className="relative h-32 sm:h-40 overflow-hidden flex-shrink-0">
          <img
            src={coverUrl}
            alt={guide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-black/40" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title Header */}
          <div className="absolute bottom-3 left-5 right-5">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-400/20 shadow">
              Cẩm Nang & Luật Chơi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif mt-1 drop-shadow-md">
              {guide.title}
            </h2>
            <p className="text-xs text-amber-200/90 font-medium">
              {guide.subtitle}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 p-1 flex-shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Mục Tiêu & Bàn Cờ', icon: BookOpen },
            { id: 'pieces', label: 'Cách Đi & Bắt Quân', icon: Shield },
            { id: 'special', label: 'Luật Đặc Biệt', icon: Sparkles },
            { id: 'tips', label: 'Chiến Thuật & Mẹo', icon: Lightbulb }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-200 text-xs sm:text-sm leading-relaxed">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                <h4 className="font-extrabold text-amber-300 text-sm mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> Tổng Quan & Mục Tiêu
                </h4>
                <p className="text-slate-300 leading-relaxed">{guide.overview}</p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 shadow-inner">
                <h4 className="font-extrabold text-amber-300 text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" /> Bàn Cờ & Thiết Lập Ban Đầu
                </h4>
                <p className="text-slate-300 leading-relaxed">{guide.setup}</p>
              </div>
            </div>
          )}

          {/* TAB 2: PIECES */}
          {activeTab === 'pieces' && (
            <div className="space-y-3">
              {guide.pieces.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1 hover:border-amber-500/40 transition-colors"
                >
                  <div className="font-bold text-amber-400 text-xs sm:text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {p.name}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed pl-4">
                    {p.move}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SPECIAL RULES */}
          {activeTab === 'special' && (
            <div className="space-y-3">
              {guide.specialRules && guide.specialRules.length > 0 ? (
                guide.specialRules.map((sr, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1"
                  >
                    <div className="font-bold text-amber-300 text-xs sm:text-sm flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {sr.name}
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed pl-5">
                      {sr.desc}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic text-center py-6">
                  Môn cờ này tuân theo luật cờ cơ bản đã mô tả ở mục Tổng quan.
                </p>
              )}
            </div>
          )}

          {/* TAB 4: TIPS & STRATEGY */}
          {activeTab === 'tips' && (
            <div className="space-y-3">
              {guide.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg transition-all"
          >
            Đã Hiểu Luật, Vào Chơi Ngay!
          </button>
        </div>
      </div>
    </div>
  );
};
