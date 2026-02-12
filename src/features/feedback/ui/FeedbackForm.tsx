import { useState, useEffect } from 'react';
import { useFeedback } from '../model/useFeedback';

export function FeedbackForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const { isSubmitting, isSubmitted, error, submitFeedback, reset } = useFeedback();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitFeedback(name, message);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleReset = () => {
    reset();
    setName('');
    setMessage('');
  };

  // Auto-close modal after successful submission
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        handleClose();
        handleReset();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-all flex items-center justify-center ${
          isOpen
            ? 'bg-[#3a3a40] text-white/70'
            : 'bg-accent text-black hover:brightness-110'
        }`}
        aria-label="문의하기"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div className="bg-[#1a1a1e] rounded-2xl border border-white/10 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.7)]">
            {/* Header */}
            <h2 className="text-base font-bold text-white mb-5">
              문의하기
            </h2>

            {/* Success State */}
            {isSubmitted ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-accent/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-medium">전송 완료</p>
                <p className="text-white/40 text-sm">빠르게 확인하겠습니다</p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 (선택)"
                  className="w-full px-3.5 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white placeholder:text-white/25 text-sm focus:border-accent/50 focus:bg-white/[0.08] focus:outline-none transition-all"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="문의 내용을 입력해주세요"
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white placeholder:text-white/25 text-sm focus:border-accent/50 focus:bg-white/[0.08] focus:outline-none transition-all resize-none"
                />

                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!message.trim() || isSubmitting}
                  className="w-full py-2.5 bg-accent text-black font-semibold rounded-lg hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {isSubmitting ? '전송 중...' : '보내기'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
