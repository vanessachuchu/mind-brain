import { Link } from "react-router-dom";
import { useState } from "react";
import { Trash2, Edit, Lightbulb, Sparkles } from "lucide-react";
import { useThoughts } from "@/hooks/useThoughts";
import { ActionPlanGenerator } from "@/components/ActionPlanGenerator";
import { Button } from "@/components/ui/button";

export interface ThoughtCardProps {
  id: string;
  content: string;
}

export default function ThoughtCard({ id, content }: ThoughtCardProps) {
  const { updateThought, deleteThought } = useThoughts();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showActionPlan, setShowActionPlan] = useState(false);

  const handleSave = () => {
    console.log("ThoughtCard handleSave called for id:", id);
    updateThought(id, {
      content: editContent.trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    console.log("ThoughtCard handleDelete called for id:", id);
    if (window.confirm("確定要刪除這個思緒卡片嗎？")) {
      console.log("User confirmed deletion for id:", id);
      deleteThought(id);
      console.log("deleteThought called for id:", id);
    } else {
      console.log("User cancelled deletion for id:", id);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-card p-5 rounded-xl shadow border border-border">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full mb-3 p-2 border rounded resize-none"
          rows={4}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/80"
          >
            保存
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-5 rounded-xl shadow group hover:shadow-lg transition-shadow flex flex-col gap-2 border border-border">
      <div className="text-base leading-relaxed text-foreground mb-4 min-h-[64px]">{content}</div>
      
      {/* 行動計畫區域 */}
      {showActionPlan && (
        <div className="border-t border-border pt-4">
          <ActionPlanGenerator 
            messages={[]} // 如果需要AI對話歷史，可以從思緒中提取
            thoughtContent={content}
            onGenerateActionPlan={() => {}} // 保持接口兼容
            thoughtId={id}
          />
        </div>
      )}
      
      <div className="mt-auto flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-500 hover:text-primary transition opacity-0 group-hover:opacity-100"
            title="編輯"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
            title="刪除"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActionPlan(!showActionPlan)}
            className="text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {showActionPlan ? '收起' : '生成行動規劃'}
          </Button>
          <Link
            to={`/thought/${id}`}
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/80 transition"
          >
            深入挖掘
          </Link>
        </div>
      </div>
    </div>
  );
}
