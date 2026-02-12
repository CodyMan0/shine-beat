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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent rounded-full shadow-lg hover:brightness-110 hover:scale-105 transition-all flex items-center justify-center group"
        aria-label="문의하기"
      >
        <svg
          className="w-6 h-6 text-black"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
          style={{
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div className="bg-[#2a2a2f] rounded-xl border border-[#4a4a50] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-primary tracking-wide">
                문의하기
              </h2>
              <button
                onClick={handleClose}
                className="text-text-muted hover:text-text-primary transition-colors"
                aria-label="닫기"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Success State */}
            {isSubmitted ? (
              <div className="text-center space-y-3 py-4">
                <div className="text-accent text-2xl">✓</div>
                <p className="text-text-primary font-medium">문의가 전송되었습니다</p>
                <p className="text-text-muted text-sm">빠르게 확인하겠습니다</p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 (선택)"
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:border-accent focus:outline-none transition-colors"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="문의 내용을 입력해주세요"
                  rows={3}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:border-accent focus:outline-none transition-colors resize-none"
                />

                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!message.trim() || isSubmitting}
                  className="w-full py-2.5 bg-accent text-black font-semibold rounded-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {isSubmitting ? '전송 중...' : '문의 보내기'}
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
            transform: translateY(8px) scale(0.95);
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
