import React, { useState } from 'react';
import { MessageSquarePlus, Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { db, generateUUID } from '../services/database';
import { FeedbackEntry } from '../types';

const FeedbackForm: React.FC = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<string>('sugestao');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }
    if (!comment.trim()) {
      setError("Por favor, escreva um comentário.");
      return;
    }

    setLoading(true);
    setError(null);

    const feedback: FeedbackEntry = {
      id: generateUUID(),
      rating,
      category,
      comment,
      created_at: new Date().toISOString()
    };

    try {
      await db.saveFeedback(feedback);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar feedback.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fade-in text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Obrigado!</h2>
          <p className="text-slate-500 mb-8">
            Seu feedback é fundamental para tornarmos o Rise Mindr cada vez melhor para sua jornada.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setRating(0);
              setComment('');
              setCategory('sugestao');
            }}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Enviar outro feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-10">
      
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-[#F87A14] flex items-center justify-center gap-3">
           <MessageSquarePlus size={36} />
           Sua Opinião
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto mt-2">
          Ajude-nos a melhorar. O que você está achando do Rise Mindr?
          Seu feedback é anônimo para outros usuários.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Rating */}
            <div className="text-center space-y-3">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Como você avalia sua experiência?
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      size={36}
                      fill={star <= (hoverRating || rating) ? "#FBBF24" : "none"}
                      className={star <= (hoverRating || rating) ? "text-amber-400" : "text-slate-200"}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-medium text-slate-400 h-4">
                {rating === 1 && "Precisa melhorar"}
                {rating === 2 && "Razoável"}
                {rating === 3 && "Bom"}
                {rating === 4 && "Muito Bom"}
                {rating === 5 && "Excelente!"}
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                 Tipo de Feedback
               </label>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 {[
                   { id: 'elogio', label: 'Elogio' },
                   { id: 'sugestao', label: 'Sugestão' },
                   { id: 'problema', label: 'Problema' },
                   { id: 'outro', label: 'Outro' }
                 ].map((cat) => (
                   <button
                     key={cat.id}
                     type="button"
                     onClick={() => setCategory(cat.id)}
                     className={`py-3 px-2 rounded-xl text-sm font-medium transition-all border ${
                       category === cat.id 
                         ? 'bg-amber-50 border-amber-200 text-amber-800' 
                         : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                     }`}
                   >
                     {cat.label}
                   </button>
                 ))}
               </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Seu Comentário
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte-nos o que você mais gostou ou o que podemos melhorar..."
                className="w-full h-32 p-4 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-4 focus:ring-orange-100 transition-all resize-none text-slate-700 bg-slate-50 focus:bg-white"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#F87A14] to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Send size={20} /> Enviar Feedback
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;