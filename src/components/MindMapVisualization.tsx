
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

// 摘要長文本為關鍵詞
function extractKeywords(text: string): string {
  if (!text || text.trim().length === 0) return '思考';
  
  // 移除無關字詞和標點符號
  let cleaned = text
    .replace(/[？！。，；：「」『』（）\n\r]/g, '')
    .replace(/我覺得|我想|我希望|我認為|我覺得|可能|也許|或許|應該|需要/g, '')
    .trim();
  
  // 如果文本很短，直接返回
  if (cleaned.length <= 6) return cleaned || '思考';
  
  // 提取核心名詞和動詞
  const corePatterns = [
    /(學習|工作|目標|計畫|問題|想法|感受|經驗|挑戰|機會|成長|改變|決定|選擇)/,
    /([A-Za-z]+)/, // 英文單詞
    /([\u4e00-\u9fa5]{2,4})/ // 2-4個中文字的詞
  ];
  
  for (const pattern of corePatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1] && match[1].length >= 2 && match[1].length <= 8) {
      return match[1];
    }
  }
  
  // 最後的備選方案：取前4-6個字符
  if (cleaned.length > 8) {
    return cleaned.substring(0, 5);
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

  // 本地邏輯分析（當AI API不可用時的備選方案）
  const generateLocalAnalysis = () => {
    const userMessages = messages.filter(msg => msg.role === 'user' && msg.content !== thoughtContent);
    const aiMessages = messages.filter(msg => msg.role === 'assistant');
    
    const analysis: AiMindMapAnalysis = {
      mainTheme: extractKeywords(thoughtContent),
      thinkingFlow: userMessages.map((msg, index) => ({
        phase: `思考階段${index + 1}`,
        keyPoints: [extractKeywords(msg.content)],
        insights: aiMessages[index] ? [extractKeywords(aiMessages[index].content)] : [],
        questions: [extractKeywords(msg.content)]
      })),
      connections: [],
      conclusion: aiMessages.length > 0 ? extractKeywords(aiMessages[aiMessages.length - 1].content) : '持續思考'
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

  // 生成AI分析的節點
  const generateAiNodes = () => {
    if (!aiAnalysis) return;

    const newNodes: MindMapNode[] = [];
    const canvasWidth = 800;
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

  // 生成傳統節點
  const generateTraditionalNodes = () => {
    const newNodes: MindMapNode[] = [];
    const canvasWidth = 800;
    const yStep = 120;
    
    // 根節點
    newNodes.push({
      id: 'root',
      text: extractKeywords(thoughtContent),
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
      const topicWidth = Math.max(canvasWidth / conversationRounds, 150);
      const totalWidth = topicWidth * conversationRounds;
      const startX = (canvasWidth - totalWidth) / 2 + topicWidth / 2;

      for (let i = 0; i < conversationRounds; i++) {
        const userMsg = userMessages[i];
        const aiMsg = assistantMessages[i];
        
        if (!userMsg || !aiMsg) continue;
        
        const topicX = startX + i * topicWidth;
        const topicY = 60 + yStep;
        
        // 用戶思考節點
        newNodes.push({
          id: `topic-${i}`,
          text: extractKeywords(userMsg.content),
          originalText: userMsg.content,
          x: topicX,
          y: topicY,
          level: 1,
          parentId: 'root',
          type: 'theme'
        });
        
        // AI洞察節點
        const insightX = topicX;
        const insightY = topicY + yStep;
        
        newNodes.push({
          id: `insight-${i}`,
          text: extractKeywords(aiMsg.content),
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
      
      // 節點文字
      const fontSize = node.type === 'root' ? 18 : node.type === 'theme' ? 15 : 12;
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
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setHoveredNode(null);
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
              onClick={analyzeConversationWithAI}
              disabled={isAiAnalyzing || messages.length < 2}
              className="h-8 px-3 text-xs"
              title="AI智能分析思考邏輯"
            >
              {isAiAnalyzing ? (
                <Sparkles size={12} className="animate-spin mr-1" />
              ) : (
                <Brain size={12} className="mr-1" />
              )}
              {isAiAnalyzing ? '分析中...' : 'AI分析'}
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
                title="切換回傳統模式"
              >
                傳統模式
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
          style={{ height: '400px' }}
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
        
        <div className="flex items-center gap-1 text-muted-foreground/70">
          💡 提示：{useAiMode ? 'AI分析模式顯示思考邏輯結構' : '傳統模式按時間順序排列'} • 滾輪縮放 • 拖拽移動 • 懸停查看詳情
        </div>
        
        {aiAnalysis && (
          <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-xs">
            <strong>分析摘要：</strong>{aiAnalysis.mainTheme} → {aiAnalysis.conclusion}
          </div>
        )}
      </div>
    </div>
  );
}
