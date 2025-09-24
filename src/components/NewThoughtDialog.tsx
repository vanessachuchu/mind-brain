import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Hash } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useThoughts, type Thought } from '@/hooks/useThoughts';
import VoiceInputButton from '@/components/VoiceInputButton';
import { useToast } from '@/hooks/use-toast';

interface NewThoughtDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onThoughtAdded?: () => void;
}

export default function NewThoughtDialog({ isOpen, onClose, onThoughtAdded }: NewThoughtDialogProps) {
  const [content, setContent] = useState('');
  const { addThought } = useThoughts();
  const { toast } = useToast();
  
  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported: voiceSupported,
    error: voiceError
  } = useVoiceRecognition();

  // 同步語音轉錄到內容
  useEffect(() => {
    if (transcript) {
      setContent(prev => prev + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // 顯示語音錯誤
  useEffect(() => {
    if (voiceError) {
      toast({
        title: "語音輸入錯誤",
        description: voiceError,
        variant: "destructive",
      });
    }
  }, [voiceError, toast]);


  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "請輸入思緒內容",
        description: "思緒內容不能為空",
        variant: "destructive",
      });
      return;
    }

    const newThought: Thought = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content: content.trim(),
    };

    addThought(newThought);
    
    toast({
      title: "思緒已記錄",
      description: "您的新思緒已成功保存",
    });

    // 通知父組件思緒已添加，觸發重新整理
    onThoughtAdded?.();

    // 重置表單
    setContent('');
    onClose();
  };

  const handleClose = () => {
    // 重置表單
    setContent('');
    resetTranscript();
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-gradient-text">
            ✨ 記錄新思緒
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 思緒內容輸入區 */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm font-medium">
              思緒內容
            </Label>
            <div className="relative">
              <Textarea
                id="content"
                placeholder="寫下您的想法、靈感或感受..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] pr-14 resize-none"
              />
              {voiceSupported && (
                <div className="absolute top-3 right-3">
                  <VoiceInputButton
                    isRecording={isRecording}
                    onStartRecording={startRecording}
                    onStopRecording={stopRecording}
                    size="sm"
                  />
                </div>
              )}
            </div>
            {isRecording && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                正在錄音中... 再次點擊停止
              </div>
            )}
          </div>


          {/* 操作按鈕 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="bg-gradient-accent hover:shadow-soft"
            >
              記錄思緒
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}