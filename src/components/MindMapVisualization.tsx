
import { useEffect, useRef, useState, useCallback } from 'react';
import { AiMessage } from '@/hooks/useAiDeepDive';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCcw, Brain, Sparkles } from 'lucide-react';

interface MindMapVisualizationProps {
  messages: AiMessage[];
  thoughtContent: string;
}

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  parentId?: string;
  type: 'root' | 'theme' | 'question' | 'insight' | 'conclusion' | 'connection';
  originalText?: string; // 保存完整文本用於 tooltip
  isHovered?: boolean;
  weight?: number; // 節點重要性權重
  connections?: string[]; // 連接到其他節點的ID
}

interface AiMindMapAnalysis {
  mainTheme: string;
  thinkingFlow: {
    phase: string;
    keyPoints: string[];
    insights: string[];
    questions: string[];
  }[];
  connections: {
    from: string;
    to: string;
    relation: string;
  }[];
  conclusion: string;
}

// 智能摘要文本內容
function intelligentSummary(text: string, maxLength: number = 15): string {
  if (!text || text.trim().length === 0) return '思考';
  
  // 清理文本
  let cleaned = text
    .replace(/[？！。，；：「」『』（）\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // 如果文本很短，直接返回
  if (cleaned.length <= maxLength) return cleaned || '思考';
  
  // 優先提取有意義的短語
  const meaningfulPatterns = [
    // 行動相關
    /(如何.{1,10}|怎麼.{1,10}|什麼時候.{1,10}|為什麼.{1,10})/,
    // 情感和狀態
    /(感到.{1,8}|覺得.{1,8}|希望.{1,8}|想要.{1,8})/,
    // 目標和計劃
    /(目標.{1,8}|計畫.{1,8}|打算.{1,8}|決定.{1,8})/,
    // 問題和挑戰
    /(問題.{1,8}|困難.{1,8}|挑戰.{1,8}|障礙.{1,8})/,
    // 學習和成長
    /(學習.{1,8}|提升.{1,8}|改善.{1,8}|發展.{1,8})/,
    // 工作和事業
    /(工作.{1,8}|職業.{1,8}|事業.{1,8}|專案.{1,8})/
  ];
  
  for (const pattern of meaningfulPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1] && match[1].length <= maxLength) {
      return match[1];
    }
  }
  
  // 找出句子的核心部分（主詞+動詞+受詞的模式）
  const sentencePatterns = [
    /(.{1,6}(?:需要|想要|希望|計畫|決定).{1,8})/,
    /(.{1,8}(?:關於|是|有|在|對).{1,6})/,
    /((?:學習|工作|生活|感情|健康).{1,8})/
  ];
  
  for (const pattern of sentencePatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1] && match[1].length <= maxLength) {
      return match[1];
    }
  }
  
  // 智能切割：在適當的位置切斷
  if (cleaned.length > maxLength) {
    // 尋找最佳切割點（避免在詞語中間切斷）
    let cutIndex = maxLength;
    const delimiters = ['，', '、', ' ', '的', '了', '是', '在', '有', '要'];
    
    for (let i = Math.max(8, maxLength - 3); i <= Math.min(cleaned.length - 1, maxLength + 3); i++) {
      if (delimiters.includes(cleaned[i])) {
        cutIndex = i;
        break;
      }
    }
    
    let result = cleaned.substring(0, cutIndex);
    
    // 清理結尾
    result = result.replace(/[的了在有要]$/, '');
    
    return result || cleaned.substring(0, Math.min(10, cleaned.length));
  }
  
  return cleaned || '思考';
}

export function MindMapVisualization({ messages, thoughtContent }: MindMapVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [useAiMode, setUseAiMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiMindMapAnalysis | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

  // 自動調整視圖以適應所有節點
  const autoFitView = useCallback(() => {
    if (nodes.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    // 計算所有節點的邊界
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.x - 60); // 留出文字空間
      maxX = Math.max(maxX, node.x + 60);
      minY = Math.min(minY, node.y - 30);
      maxY = Math.max(maxY, node.y + 40);
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // 計算適合的縮放比例（留出邊距）
    const padding = 40;
    const scaleX = (canvasWidth - padding * 2) / contentWidth;
    const scaleY = (canvasHeight - padding * 2) / contentHeight;
    const newZoom = Math.min(scaleX, scaleY, 1.5); // 最大不超過1.5倍
    
    // 計算居中的偏移
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newOffsetX = canvasWidth / 2 - centerX * newZoom;
    const newOffsetY = canvasHeight / 2 - centerY * newZoom;
    
    setZoom(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [nodes]);

  // AI分析對話內容，生成心智圖結構
  const analyzeConversationWithAI = async () => {
    if (messages.length < 2) return;
    
    setIsAiAnalyzing(true);
    
    try {
      const conversationText = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role === 'user' ? '用戶' : 'AI'}: ${msg.content}`)
        .join('\n\n');

      const prompt = `
請分析以下對話內容，提取思考的邏輯流程和關鍵概念，生成心智圖結構：

對話內容：
${conversationText}

請以JSON格式返回分析結果，包含：
1. mainTheme: 主要思考主題（3-8字）
2. thinkingFlow: 思考流程的各個階段
3. connections: 概念之間的關聯
4. conclusion: 思考的結論或方向

JSON格式範例：
{
  "mainTheme": "職涯規劃",
  "thinkingFlow": [
    {
      "phase": "現狀分析",
      "keyPoints": ["工作不滿", "技能不足"],
      "insights": ["需要改變", "學習機會"],
      "questions": ["如何開始", "時間安排"]
    }
  ],
  "connections": [
    {"from": "現狀分析", "to": "技能提升", "relation": "導向"}
  ],
  "conclusion": "制定學習計畫"
}

請只返回JSON，不要其他說明文字。`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一個專業的思維導圖分析師，專門分析對話內容並提取邏輯結構。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error('AI分析失敗');
      }

      const data = await response.json();
      const analysisText = data.choices[0]?.message?.content;
      
      if (analysisText) {
        const analysis = JSON.parse(analysisText) as AiMindMapAnalysis;
        setAiAnalysis(analysis);
        setUseAiMode(true);
      }
    } catch (error) {
      console.error('AI分析錯誤:', error);
      // 如果API失敗，使用本地邏輯分析
      generateLocalAnalysis();
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // 智能本地分析（改進的備選方案）
  const generateLocalAnalysis = () => {
    const userMessages = messages.filter(msg => msg.role === 'user' && msg.content !== thoughtContent);
    const aiMessages = messages.filter(msg => msg.role === 'assistant');
    
    // 分析思考主題
    const mainTheme = intelligentSummary(thoughtContent, 12);
    
    // 智能分析每個對話回合
    const thinkingFlow = userMessages.map((msg, index) => {
      const aiResponse = aiMessages[index];
      
      // 分析用戶問題的核心
      const userCore = intelligentSummary(msg.content, 15);
      
      // 從AI回應中提取關鍵洞察
      let insights: string[] = [];
      if (aiResponse) {
        const sentences = aiResponse.content.split(/[。！？]/);
        insights = sentences
          .filter(s => s.trim().length > 10)
          .slice(0, 2)
          .map(s => intelligentSummary(s.trim(), 20))
          .filter(s => s.length > 3);
      }
      
      // 生成相關問題
      const questions = [userCore];
      if (msg.content.includes('如何') || msg.content.includes('怎麼')) {
        questions.push('具體步驟');
      }
      if (msg.content.includes('為什麼') || msg.content.includes('原因')) {
        questions.push('深層原因');
      }
      
      return {
        phase: `${userCore}`,
        keyPoints: [intelligentSummary(msg.content, 18)],
        insights: insights.length > 0 ? insights : [intelligentSummary(aiResponse?.content || '持續探索', 16)],
        questions: questions.slice(0, 2)
      };
    });
    
    // 生成智能連接
    const connections = [];
    for (let i = 0; i < thinkingFlow.length - 1; i++) {
      connections.push({
        from: thinkingFlow[i].phase,
        to: thinkingFlow[i + 1].phase,
        relation: '延伸思考'
      });
    }
    
    // 分析結論
    let conclusion = '持續探索';
    if (aiMessages.length > 0) {
      const lastResponse = aiMessages[aiMessages.length - 1].content;
      conclusion = intelligentSummary(lastResponse, 16);
    }
    
    const analysis: AiMindMapAnalysis = {
      mainTheme,
      thinkingFlow,
      connections,
      conclusion
    };
    
    setAiAnalysis(analysis);
    setUseAiMode(true);
  };

  // 生成節點數據
  const generateNodes = useCallback(() => {
    if (useAiMode && aiAnalysis) {
      generateAiNodes();
    } else {
      generateTraditionalNodes();
    }
  }, [messages, thoughtContent, useAiMode, aiAnalysis]);

  // 生成AI分析的節點（響應式版本）
  const generateAiNodes = () => {
    if (!aiAnalysis) return;

    const newNodes: MindMapNode[] = [];
    
    // 響應式畫布尺寸
    const canvas = canvasRef.current;
    const canvasWidth = canvas ? Math.min(800, canvas.getBoundingClientRect().width * 0.8) : 600;
    const centerX = canvasWidth / 2;
    
    // 根節點（主題）
    newNodes.push({
      id: 'root',
      text: aiAnalysis.mainTheme,
      originalText: thoughtContent,
      x: centerX,
      y: 60,
      level: 0,
      type: 'root',
      weight: 10
    });

    // 思考流程節點
    const flowCount = aiAnalysis.thinkingFlow.length;
    const radius = 200;
    const angleStep = (2 * Math.PI) / Math.max(flowCount, 3);
    
    aiAnalysis.thinkingFlow.forEach((flow, index) => {
      const angle = index * angleStep - Math.PI / 2; // 從頂部開始
      const phaseX = centerX + radius * Math.cos(angle);
      const phaseY = 180 + radius * Math.sin(angle);
      
      // 階段節點
      newNodes.push({
        id: `phase-${index}`,
        text: flow.phase,
        originalText: `階段: ${flow.phase}`,
        x: phaseX,
        y: phaseY,
        level: 1,
        parentId: 'root',
        type: 'theme',
        weight: 8
      });

      // 關鍵點節點
      flow.keyPoints.forEach((point, pointIndex) => {
        const pointAngle = angle + (pointIndex - flow.keyPoints.length / 2) * 0.3;
        const pointX = phaseX + 80 * Math.cos(pointAngle);
        const pointY = phaseY + 80 * Math.sin(pointAngle);
        
        newNodes.push({
          id: `point-${index}-${pointIndex}`,
          text: point,
          originalText: point,
          x: pointX,
          y: pointY,
          level: 2,
          parentId: `phase-${index}`,
          type: 'question',
          weight: 5
        });
      });

      // 洞察節點
      flow.insights.forEach((insight, insightIndex) => {
        const insightAngle = angle + (insightIndex - flow.insights.length / 2) * 0.4 + Math.PI;
        const insightX = phaseX + 100 * Math.cos(insightAngle);
        const insightY = phaseY + 100 * Math.sin(insightAngle);
        
        newNodes.push({
          id: `insight-${index}-${insightIndex}`,
          text: insight,
          originalText: insight,
          x: insightX,
          y: insightY,
          level: 2,
          parentId: `phase-${index}`,
          type: 'insight',
          weight: 7
        });
      });
    });

    // 結論節點
    if (aiAnalysis.conclusion) {
      newNodes.push({
        id: 'conclusion',
        text: aiAnalysis.conclusion,
        originalText: aiAnalysis.conclusion,
        x: centerX,
        y: 450,
        level: 1,
        parentId: 'root',
        type: 'conclusion',
        weight: 9
      });
    }

    setNodes(newNodes);
  };

  // 生成傳統節點（響應式改進版）
  const generateTraditionalNodes = () => {
    const newNodes: MindMapNode[] = [];
    
    // 響應式畫布尺寸
    const canvas = canvasRef.current;
    const canvasWidth = canvas ? Math.min(800, canvas.getBoundingClientRect().width * 0.85) : 600;
    const yStep = Math.max(80, Math.min(120, canvasWidth / 6)); // 響應式間距
    
    // 根節點
    newNodes.push({
      id: 'root',
      text: intelligentSummary(thoughtContent, 12),
      originalText: thoughtContent,
      x: canvasWidth / 2,
      y: 60,
      level: 0,
      type: 'root'
    });
    
    // 處理對話訊息
    const userMessages = messages.filter(msg => msg.role === 'user' && msg.content !== thoughtContent);
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    const conversationRounds = Math.min(userMessages.length, assistantMessages.length);
    
    if (conversationRounds > 0) {
      const topicWidth = Math.max(canvasWidth / conversationRounds, 180);
      const totalWidth = topicWidth * conversationRounds;
      const startX = (canvasWidth - totalWidth) / 2 + topicWidth / 2;

      for (let i = 0; i < conversationRounds; i++) {
        const userMsg = userMessages[i];
        const aiMsg = assistantMessages[i];
        
        if (!userMsg || !aiMsg) continue;
        
        const topicX = startX + i * topicWidth;
        const topicY = 60 + yStep;
        
        // 用戶思考節點（使用智能摘要）
        newNodes.push({
          id: `topic-${i}`,
          text: intelligentSummary(userMsg.content, 15),
          originalText: userMsg.content,
          x: topicX,
          y: topicY,
          level: 1,
          parentId: 'root',
          type: 'theme'
        });
        
        // AI洞察節點（使用智能摘要）
        const insightX = topicX;
        const insightY = topicY + yStep;
        
        newNodes.push({
          id: `insight-${i}`,
          text: intelligentSummary(aiMsg.content, 18),
          originalText: aiMsg.content,
          x: insightX,
          y: insightY,
          level: 2,
          parentId: `topic-${i}`,
          type: 'insight'
        });
      }
    }
    
    setNodes(newNodes);
  };

  // 繪製心智圖
  const drawMindMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 設置canvas尺寸
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // 應用變換
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);
    
    // 清除畫布
    ctx.clearRect(-offset.x/zoom, -offset.y/zoom, canvas.width/(zoom*window.devicePixelRatio), canvas.height/(zoom*window.devicePixelRatio));
    
    // 繪製背景網格
    drawGrid(ctx, canvas.width/(zoom*window.devicePixelRatio), canvas.height/(zoom*window.devicePixelRatio));
    
    // 繪製連線
    drawConnections(ctx);
    
    // 繪製節點
    drawNodes(ctx);
    
    ctx.restore();
  }, [nodes, zoom, offset, hoveredNode]);

  // 繪製背景網格
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 0.5;
    const gridSize = 50;
    
    for (let x = -offset.x/zoom % gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -offset.y/zoom);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = -offset.y/zoom % gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-offset.x/zoom, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // 繪製連線
  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          // 繪製曲線連接
          const isHovered = hoveredNode === node.id || hoveredNode === parent.id;
          ctx.strokeStyle = isHovered ? '#3b82f6' : '#cbd5e1';
          ctx.lineWidth = isHovered ? 3 : 2;
          
          ctx.beginPath();
          ctx.moveTo(parent.x, parent.y);
          
          // 使用貝塞爾曲線創造更自然的連接
          const midX = (parent.x + node.x) / 2;
          const midY = parent.y + (node.y - parent.y) * 0.3;
          ctx.quadraticCurveTo(midX, midY, node.x, node.y);
          ctx.stroke();
          
          // 添加方向箭頭
          if (isHovered) {
            drawArrow(ctx, parent.x, parent.y, node.x, node.y);
          }
        }
      }
    });
  };

  // 繪製箭頭
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;
    
    const arrowX = toX - arrowLength * Math.cos(angle - arrowAngle);
    const arrowY = toY - arrowLength * Math.sin(angle - arrowAngle);
    const arrowX2 = toX - arrowLength * Math.cos(angle + arrowAngle);
    const arrowY2 = toY - arrowLength * Math.sin(angle + arrowAngle);
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(arrowX, arrowY);
    ctx.moveTo(toX, toY);
    ctx.lineTo(arrowX2, arrowY2);
    ctx.stroke();
  };

  // 繪製節點
  const drawNodes = (ctx: CanvasRenderingContext2D) => {
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      
      // 根據節點類型設置樣式
      let nodeColor = '#64748b';
      let nodeSize = 8;
      let shadowColor = 'rgba(0,0,0,0.2)';
      
      switch (node.type) {
        case 'root':
          nodeColor = '#8b5cf6'; // 紫色 - 核心主題
          nodeSize = 18;
          shadowColor = 'rgba(139,92,246,0.4)';
          break;
        case 'theme':
          nodeColor = '#3b82f6'; // 藍色 - 主要階段
          nodeSize = 14;
          shadowColor = 'rgba(59,130,246,0.3)';
          break;
        case 'question':
          nodeColor = '#10b981'; // 綠色 - 問題/關鍵點
          nodeSize = 10;
          shadowColor = 'rgba(16,185,129,0.3)';
          break;
        case 'insight':
          nodeColor = '#f59e0b'; // 橙色 - AI洞察
          nodeSize = 12;
          shadowColor = 'rgba(245,158,11,0.3)';
          break;
        case 'conclusion':
          nodeColor = '#ef4444'; // 紅色 - 結論
          nodeSize = 16;
          shadowColor = 'rgba(239,68,68,0.3)';
          break;
        case 'connection':
          nodeColor = '#6366f1'; // 靛藍色 - 連接
          nodeSize = 8;
          shadowColor = 'rgba(99,102,241,0.3)';
          break;
      }
      
      // 根據權重調整大小
      if (node.weight) {
        nodeSize = Math.max(6, Math.min(20, nodeSize + (node.weight - 5) * 2));
      }
      
      if (isHovered) {
        nodeSize += 4;
      }
      
      // 節點陰影
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = isHovered ? 20 : 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      // 節點圓圈
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // 添加節點邊框
      ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();
      
      // 重置陰影
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // 節點文字（響應式字體大小）
      let fontSize = node.type === 'root' ? 18 : node.type === 'theme' ? 15 : 12;
      
      // 根據縮放調整字體大小，確保可讀性
      fontSize = Math.max(10, fontSize * Math.min(zoom, 1.2));
      
      const fontWeight = node.type === 'root' ? 'bold' : 'normal';
      ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 文字背景
      const textWidth = ctx.measureText(node.text).width;
      const textHeight = fontSize + 6;
      const padding = 10;
      
      const bgColor = isHovered ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.95)';
      ctx.fillStyle = bgColor;
      ctx.fillRect(
        node.x - textWidth / 2 - padding,
        node.y - textHeight / 2 + nodeSize + 8,
        textWidth + padding * 2,
        textHeight
      );
      
      // 文字邊框
      ctx.strokeStyle = isHovered ? nodeColor : '#e2e8f0';
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.strokeRect(
        node.x - textWidth / 2 - padding,
        node.y - textHeight / 2 + nodeSize + 8,
        textWidth + padding * 2,
        textHeight
      );
      
      // 繪製文字
      ctx.fillStyle = '#1f2937';
      ctx.fillText(node.text, node.x, node.y + nodeSize + 16);
    });
  };

  useEffect(() => {
    generateNodes();
  }, [generateNodes]);

  useEffect(() => {
    drawMindMap();
  }, [drawMindMap]);

  // 在節點生成完成後自動調整視圖
  useEffect(() => {
    if (nodes.length > 0) {
      // 短延遲確保canvas已渲染
      setTimeout(autoFitView, 100);
    }
  }, [nodes, autoFitView]);

  // 監聽窗口大小變化
  useEffect(() => {
    const handleResize = () => {
      setTimeout(autoFitView, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoFitView]);

  // 鼠標事件處理
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / zoom,
      y: (e.clientY - rect.top - offset.y) / zoom
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // 檢查鼠標是否懸停在節點上
      const mousePos = getMousePos(e);
      let foundNode = null;
      
      for (const node of nodes) {
        const distance = Math.sqrt(
          Math.pow(mousePos.x - node.x, 2) + Math.pow(mousePos.y - node.y, 2)
        );
        if (distance <= 30) { // 擴大懸停區域
          foundNode = node.id;
          break;
        }
      }
      
      setHoveredNode(foundNode);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));
    setZoom(newZoom);
  };

  // 控制函數
  const handleZoomIn = () => setZoom(prev => Math.min(3, prev * 1.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev / 1.2));
  const handleReset = () => {
    setHoveredNode(null);
    autoFitView();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `思考流程圖_${new Date().toLocaleDateString()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // 獲取節點提示信息
  const getNodeTooltip = () => {
    if (!hoveredNode) return null;
    const node = nodes.find(n => n.id === hoveredNode);
    return node?.originalText || node?.text;
  };

  return (
    <div className="bg-background border border-border rounded-lg p-4 relative">
      {/* 標題和控制按鈕 */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">🧠 思考流程心智圖</span>
            {useAiMode && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                AI分析模式
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={useAiMode ? "default" : "outline"}
              onClick={generateLocalAnalysis}
              disabled={messages.length < 2}
              className="h-8 px-3 text-xs"
              title="智能分析思考流程（無需API）"
            >
              <Brain size={12} className="mr-1" />
              智能分析
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={analyzeConversationWithAI}
              disabled={isAiAnalyzing || messages.length < 2}
              className="h-8 px-3 text-xs"
              title="AI深度分析（需要API Key）"
            >
              {isAiAnalyzing ? (
                <Sparkles size={12} className="animate-spin mr-1" />
              ) : (
                <Sparkles size={12} className="mr-1" />
              )}
              {isAiAnalyzing ? '分析中...' : 'AI深度'}
            </Button>
            {useAiMode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setUseAiMode(false);
                  setAiAnalysis(null);
                }}
                className="h-8 px-3 text-xs"
                title="切換回傳統時間線模式"
              >
                時間線
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
            title="縮小"
          >
            <ZoomOut size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
            title="放大"
          >
            <ZoomIn size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="h-8 w-8 p-0"
            title="重置視圖"
          >
            <RotateCcw size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
            title="下載圖片"
          >
            <Download size={14} />
          </Button>
        </div>
      </div>

      {/* 心智圖畫布 */}
      <div className="relative">
        <canvas 
          ref={canvasRef}
          className="w-full border border-border rounded cursor-grab active:cursor-grabbing"
          style={{ 
            height: window.innerWidth < 640 ? '350px' : '450px',
            touchAction: 'pan-x pan-y pinch-zoom'
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
        
        {/* 提示信息 */}
        {hoveredNode && (
          <div className="absolute top-2 left-2 bg-popover border border-border rounded-md p-2 max-w-xs shadow-md z-10">
            <div className="text-xs text-muted-foreground">
              {getNodeTooltip()}
            </div>
          </div>
        )}
        
        {/* 縮放指示器 */}
        <div className="absolute bottom-2 right-2 bg-popover border border-border rounded px-2 py-1 text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* 圖例 */}
      <div className="flex flex-col gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
        {useAiMode ? (
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-purple-500 rounded-full"></span>
              核心主題
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
              思考階段
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
              關鍵問題
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
              AI洞察
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
              思考結論
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-purple-500 rounded-full"></span>
              核心思緒
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
              探討話題
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
              AI回應
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-1 text-muted-foreground/70 text-xs">
          💡 提示：{useAiMode ? '智能分析模式顯示思考邏輯結構' : '時間線模式按對話順序排列'} • 自動適配螢幕 • 懸停查看詳情 • 可滾輪縮放和拖拽
        </div>
        
        {aiAnalysis && (
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm">
            <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">思考流程分析</div>
            <div className="text-blue-700 dark:text-blue-300">
              <span className="font-medium">主題：</span>{aiAnalysis.mainTheme} 
              <span className="mx-2">→</span>
              <span className="font-medium">結論：</span>{aiAnalysis.conclusion}
            </div>
            {aiAnalysis.thinkingFlow.length > 0 && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                包含 {aiAnalysis.thinkingFlow.length} 個思考階段
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
