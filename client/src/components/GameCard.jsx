import React from 'react';
import { Play, Users, BookOpen } from 'lucide-react';

export const GAME_COVERS = {
  chess: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
  xiangqi: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
  go: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  gomoku: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&w=800&q=80',
  checkers: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=800&q=80',
  reversi: 'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?auto=format&fit=crop&w=800&q=80',
  connect_four: 'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=800&q=80',
  shogi: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
  co_ganh: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
  o_an_quan: 'https://images.unsplash.com/photo-1609803384069-1cac502f91a6?auto=format&fit=crop&w=800&q=80',
  co_ca_ngua: 'https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=800&q=80',
  nine_mens_morris: 'https://images.unsplash.com/photo-1566694271453-390536dd1f0d?auto=format&fit=crop&w=800&q=80'
};

export const GameCard = ({ game, onPlay, onOpenGuide }) => {
  const imageUrl = game.coverImage || GAME_COVERS[game.id] || GAME_COVERS.chess;

  return (
    <div className="group relative rounded-2xl overflow-hidden glass-card hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between">
      {/* Top Banner with Artwork Image */}
      <div className="relative h-44 sm:h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={game.nameVi}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30" />

        {/* Card Header Tags */}
        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-white/10 shadow">
              {game.category === 'vietnamese' ? 'Dân Gian VN' : game.category === 'strategy' ? 'Chiến Thuật' : 'Cổ Điển'}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-slate-200 border border-white/10 shadow">
              <Users className="w-3 h-3 text-amber-400" />
              <span>{game.minPlayers}-{game.maxPlayers} người</span>
            </div>
          </div>

          <div>
            <h3 className="font-extrabold text-xl sm:text-2xl text-white font-serif tracking-wide drop-shadow-lg">
              {game.nameVi}
            </h3>
            <p className="text-xs text-amber-200/90 font-medium">
              {game.name}
            </p>
          </div>
        </div>
      </div>

      {/* Description & Rules Summary */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-slate-900/80">
        <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 mb-4">
          {game.description}
        </p>

        {/* Action Buttons: Chơi ngay & Xem luật */}
        <div className="flex gap-2">
          <button
            onClick={() => onOpenGuide && onOpenGuide(game.id)}
            title="Xem hướng dẫn luật chơi"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 transition-colors flex items-center justify-center"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPlay(game)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all group-hover:shadow-amber-500/40"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Chơi Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
