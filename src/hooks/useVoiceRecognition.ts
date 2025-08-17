import { useState, useRef, useEffect } from 'react';

// 語音識別類型定義
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface VoiceRecognitionHook {
  isRecording: boolean;
  transcript: string;
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

export function useVoiceRecognition(): VoiceRecognitionHook {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // 檢查瀏覽器支援
  const isSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                             (window as any).SpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      
      // 設定語音識別參數
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-TW';
      recognition.maxAlternatives = 1;

      // 處理識別結果
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(prev => prev + finalTranscript + interimTranscript);
      };

      // 處理錯誤
      recognition.onerror = (event: any) => {
        console.error('語音識別錯誤:', event.error);
        setError(`語音識別錯誤: ${event.error}`);
        setIsRecording(false);
      };

      // 處理結束
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported]);

  const startRecording = async () => {
    if (!isSupported) {
      setError('您的瀏覽器不支援語音識別功能');
      return;
    }

    try {
      // 請求麥克風權限
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setError(null);
      setIsRecording(true);
      recognitionRef.current?.start();
    } catch (err) {
      setError('無法存取麥克風，請檢查權限設定');
      console.error('麥克風權限錯誤:', err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
    error
  };
}