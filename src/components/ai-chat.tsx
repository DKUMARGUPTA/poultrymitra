
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User, Bot, Loader, Sparkles, Volume2, StopCircle } from 'lucide-react';
import { chat } from '@/ai/flows/chat';
import { textToSpeech } from '@/ai/flows/tts';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Message, Part } from 'genkit';
import { getChatHistory, addChatMessage } from '@/services/chat.service';


// Map Genkit's `Message` to a simpler text-based message for display
const toDisplayMessage = (msg: Message): { role: 'user' | 'model'; text: string } => {
    const textContent = msg.content
        .map(part => (part.text ? part.text : ''))
        .join('\n');
    return {
        role: msg.role === 'user' ? 'user' : 'model',
        text: textContent
    }
}

const examplePrompts = [
    "Summarize my farm's performance.",
    "Which of my farmers has the highest outstanding balance?",
    "How many birds are in my latest batch?",
    "What were my last 5 transactions?",
]

export function AiChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = getChatHistory(user.uid, (history) => {
        setMessages(history);
        setHistoryLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading]);

  useEffect(() => {
    // Cleanup audio on component unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSend = async (prompt?: string) => {
    const messageToSend = prompt || input;
    if (messageToSend.trim() === '' || !user) return;

    // Stop any currently playing audio
    stopAudio();

    const userMessage: Message = { role: 'user', content: [{ text: messageToSend }] };
    
    // Optimistically update UI and save to DB
    setMessages(prev => [...prev, userMessage]);
    await addChatMessage(user.uid, userMessage);
    
    setInput('');
    setLoading(true);

    try {
      const responseText = await chat({ message: messageToSend, userId: user.uid });

      const modelMessage: Message = { role: 'model', content: [{ text: responseText }] };
      
      // Save model response to DB. The UI will update via the snapshot listener.
      await addChatMessage(user.uid, modelMessage);

    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = { role: 'model', content: [{ text: 'Sorry, I encountered an error. Please try again.' }] };
      await addChatMessage(user.uid, errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleListen = async (text: string) => {
    if (audioLoading) {
      stopAudio();
      return;
    }
    setAudioLoading(true);
    try {
      const audioDataUri = await textToSpeech(text);
      setAudioUrl(audioDataUri);
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setAudioLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioUrl(null);
    setAudioLoading(false);
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
    }
  }, [audioUrl]);
  
  const displayMessages = messages.filter(m => m.role !== 'tool');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b">
        <Bot className="w-6 h-6 mr-2 text-primary" />
        <h1 className="text-lg font-semibold font-headline">AI Assistant</h1>
      </div>
      
      {historyLoading ? (
         <div className="flex-1 flex items-center justify-center">
            <Loader className="animate-spin h-8 w-8 text-primary" />
         </div>
      ) : displayMessages.length === 0 && !loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
            <div className="text-center space-y-2">
                <Sparkles className="w-12 h-12 mx-auto text-primary" />
                <h2 className="text-3xl font-bold font-headline">How can I help you today?</h2>
                <p className="text-muted-foreground">Ask me anything about your farm, batches, or finances.</p>
            </div>
             <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                {examplePrompts.map(prompt => (
                    <button 
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        className="p-4 border rounded-lg text-left text-sm hover:bg-muted transition-colors"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
            {displayMessages.map((message, index) => {
                const displayMsg = toDisplayMessage(message);
                return (
                    <div
                    key={index}
                    className={cn(
                        'flex items-start gap-4',
                        displayMsg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                    >
                    {displayMsg.role === 'model' && (
                        <Avatar className="h-8 w-8">
                        <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={cn(
                        'max-w-md rounded-lg p-3 text-sm relative group',
                        displayMsg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                    >
                        <ReactMarkdown className="prose dark:prose-invert">
                        {displayMsg.text}
                        </ReactMarkdown>

                         {displayMsg.role === 'model' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleListen(displayMsg.text)}
                          >
                            {audioLoading ? (
                                <StopCircle className="h-4 w-4" />
                            ) : (
                                <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                    </div>
                    {displayMsg.role === 'user' && (
                        <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200`} alt="User Avatar" />
                        <AvatarFallback>
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                )
            })}
            {loading && (
                <div className="flex items-start gap-4 justify-start">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3 text-sm flex items-center">
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Thinking...
                    </div>
                </div>
            )}
            </div>
        </ScrollArea>
      )}

      {audioUrl && (
          <audio ref={audioRef} src={audioUrl} onEnded={stopAudio} onPause={stopAudio} />
      )}

      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your farm..."
            disabled={loading}
          />
          <Button onClick={() => handleSend()} disabled={loading}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
