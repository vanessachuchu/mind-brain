
import { useParams, useNavigate, Link } from "react-router-dom";
import AiDeepDiveCard from "@/components/AiDeepDiveCard";
import { useThoughts } from "@/hooks/useThoughts";
import { useTodos } from "@/hooks/useTodos";
import { Trash2 } from "lucide-react";

export default function ThoughtDetail() {
  const { id } = useParams<{ id: string }>();
  const { getThoughtById, updateAiConversation, deleteThought } = useThoughts();
  const { addTodo } = useTodos();
  const thought = getThoughtById(id || "");
  const navigate = useNavigate();

  if (!thought) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">找不到此思緒卡片</h1>
          <Link to="/" className="text-primary underline">返回首頁</Link>
        </div>
      </main>
    );
  }

  const handleDelete = () => {
    if (window.confirm("確定要刪除這個思緒卡片嗎？")) {
      deleteThought(thought.id);
      navigate("/");
    }
  };

  function handleToDo() {
    // 將思緒轉為待辦事項
    addTodo({
      content: thought.content,
      thoughtId: thought.id,
      done: false
    });
    navigate("/");
  }

  function handleActionPlanGenerated(plan: string) {
    console.log("生成的行動方案:", plan);
    // 將行動方案轉為待辦事項
    addTodo({
      content: plan,
      thoughtId: thought.id,
      done: false
    });
    navigate("/");
  }

  // 處理 AI 對話更新
  const handleConversationUpdate = (messages: Array<{role: "user" | "assistant" | "system"; content: string}>) => {
    console.log("ThoughtDetail: Updating AI conversation for thought", thought.id);
    updateAiConversation(thought.id, messages);
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8 flex justify-between items-center">
          <Link
            to="/"
            className="text-muted-foreground text-sm underline hover:text-primary"
          >
            &larr; 返回 Today
          </Link>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="p-2 text-gray-500 hover:text-red-500 transition"
              title="刪除思緒"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
        
        <div className="bg-card rounded-xl shadow p-6 border border-border mb-8">
          <div className="mb-6">
            <AiDeepDiveCard 
              thoughtContent={thought.content}
              thoughtId={thought.id}
              initialConversation={thought.aiConversation?.messages}
              onActionPlanGenerated={handleActionPlanGenerated}
              onConversationUpdate={handleConversationUpdate}
            />
          </div>

        </div>
      </main>
  );
}
