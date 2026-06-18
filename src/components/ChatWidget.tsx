import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import './ChatWidget.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const currentTerreiro = useStore(state => state.getCurrentTerreiro());
  const terreiroName = currentTerreiro?.name || '';

  // Lógica para extrair o nome principal da casa para a persona
  const getPersonaName = (name: string) => {
    if (!name) return 'seu assistente virtual';
    
    // Procura por nomes conhecidos de Orixás ou Guias
    const orixasGuias = /(Pai \w+|Mãe \w+|Caboclo \w+|Exu \w+|Oyá|Oxum|Ogum|Xangô|Iemanjá|Oxóssi|Iansã|Oxalá|Nanã|Obaluaê|Omolu|Logun Edé|Ossain|Ewa|Obá)/i;
    const match = name.match(orixasGuias);
    if (match) return match[0];

    // Fallback: Remove palavras genéricas e pega a primeira palavra restante
    const nameWithoutGeneric = name.replace(/(Terreiro|Centro|Tenda|Casa|Ilê|Reino|Cabana|de|da|do|das|dos|Umbanda|Candomblé|Nação|Kimbanda|Quimbanda|e|-)/gi, '').trim();
    const words = nameWithoutGeneric.split(' ').filter(w => w.length > 0);
    return words.length > 0 ? words[0] : 'seu assistente virtual';
  };

  const personaName = getPersonaName(terreiroName);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Olá! Sou ${personaName}, seu assistente virtual. Como posso ajudar com o Terreiras App hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Chama a Edge Function que criamos
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          // Passamos apenas as últimas mensagens para não estourar o limite de tokens da API
          messages: newMessages.slice(-10)
        }
      });

      if (error) throw error;

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Erro ao chamar assistente:', error);
      setMessages([
        ...newMessages, 
        { role: 'assistant', content: 'Desculpe, ocorreu um erro ao conectar com a IA. Tente novamente em instantes.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-widget-container">
      {isOpen ? (
        <div className="chat-window glass-panel glow-fx">
          <div className="chat-header">
            <div className="chat-title">
              <Bot size={20} className="glow-icon" color="var(--neon-cyan)" />
              <h3>Assistente Orun</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="close-btn">
              <X size={20} />
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'assistant' ? <Bot size={16} /> : <UserIcon size={16} />}
                </div>
                <div className="message-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="message-avatar">
                  <Bot size={16} />
                </div>
                <div className="message-bubble loading-bubble">
                  <Loader2 size={16} className="spinner" /> Pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua dúvida..."
              disabled={isLoading}
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="send-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="chat-fab pulse-fx"
          onClick={() => setIsOpen(true)}
          title="Falar com o Assistente"
        >
          <MessageSquare size={24} />
          <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Chat</span>
        </button>
      )}
    </div>
  );
}
