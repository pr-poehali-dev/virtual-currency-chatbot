import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Привет! Я ИИ-помощник. За каждое сообщение тратится 1 токен. Как дела?', isBot: true, timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [tokens, setTokens] = useState(100);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || tokens <= 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setTokens(prev => prev - 1);

    // Симуляция ответа ботов
    setTimeout(() => {
      const botResponses = [
        'Отличный вопрос! Давайте это обсудим.',
        'Интересно, расскажи больше!',
        'Я думаю, что это зависит от контекста.',
        'У меня есть несколько идей по этому поводу.',
        'Это действительно важная тема для размышлений.'
      ];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const exportHistory = () => {
    const history = messages.map(msg => 
      `${msg.isBot ? 'ИИ' : 'Пользователь'} (${msg.timestamp.toLocaleString()}): ${msg.text}`
    ).join('\n\n');
    
    const blob = new Blob([history], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-history.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (showChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto max-w-4xl h-screen flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm">
            <Button 
              variant="ghost" 
              onClick={() => setShowChat(false)}
              className="flex items-center gap-2"
            >
              <Icon name="ArrowLeft" size={20} />
              Назад
            </Button>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Icon name="Coins" size={16} className="mr-1" />
                {tokens} токенов
              </Badge>
              <Button onClick={exportHistory} variant="outline" size="sm">
                <Icon name="Download" size={16} className="mr-2" />
                Экспорт
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-start gap-3 max-w-xl ${message.isBot ? '' : 'flex-row-reverse'}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={message.isBot ? 'bg-primary text-primary-foreground' : 'bg-gray-500'}>
                      {message.isBot ? '🤖' : '👤'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <Card className={`${message.isBot ? 'bg-white' : 'bg-primary text-primary-foreground'}`}>
                    <CardContent className="p-3">
                      <p className="text-sm">{message.text}</p>
                      <span className={`text-xs ${message.isBot ? 'text-muted-foreground' : 'text-primary-foreground/70'} mt-1 block`}>
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-white/80 backdrop-blur-sm">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Введите сообщение..."
                disabled={tokens <= 0}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || tokens <= 0}
                className="px-6"
              >
                <Icon name="Send" size={16} />
              </Button>
            </div>
            {tokens <= 0 && (
              <p className="text-sm text-destructive mt-2">
                Токены закончились! Пополните баланс для продолжения общения.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Icon name="Sparkles" size={16} />
            Новое поколение ИИ-платформ
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            AI Platform
            <br />
            <span className="text-primary">Умное общение</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Платформа нового поколения для общения с ИИ. Используйте токены для доступа 
            к продвинутым возможностям искусственного интеллекта.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <Button 
              onClick={() => setShowChat(true)}
              size="lg" 
              className="px-8 py-3 text-lg font-medium"
            >
              <Icon name="MessageCircle" size={20} className="mr-2" />
              Начать общение
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
              <Icon name="Play" size={20} className="mr-2" />
              Посмотреть демо
            </Button>
          </div>

          {/* Token Balance Card */}
          <Card className="max-w-sm mx-auto bg-white/80 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Icon name="Coins" size={24} />
                <span className="font-semibold">Баланс токенов</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{tokens}</div>
                <p className="text-sm text-gray-600 mb-4">токенов доступно</p>
                <Button variant="outline" size="sm">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Пополнить баланс
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name="Brain" size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Умный ИИ</h3>
              <p className="text-gray-600">
                Продвинутый искусственный интеллект для решения ваших задач
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name="History" size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">История диалогов</h3>
              <p className="text-gray-600">
                Сохраняйте и экспортируйте историю всех ваших разговоров
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon name="Coins" size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Токен-система</h3>
              <p className="text-gray-600">
                Справедливая система оплаты за использование ИИ-возможностей
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">10K+</div>
            <div className="text-gray-600">Активных пользователей</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">1M+</div>
            <div className="text-gray-600">Сообщений обработано</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-gray-600">Время работы</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-gray-600">Поддержка</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;