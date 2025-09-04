import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import Auth, { UserProfile } from '@/components/Auth';
import { 
  saveMessageToDatabase,
  getUserMessagesFromDatabase,
  updateUserInDatabase,
  StoredMessage 
} from '@/utils/database';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface UserData {
  himCoins: number;
  lastDailyBonus: string;
}

const DAILY_BONUS = 200;
const STORAGE_KEY = 'himcoins_user_data';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [userData, setUserData] = useState<UserData>({ himCoins: 200, lastDailyBonus: '' });
  const [showChat, setShowChat] = useState(false);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Обработка успешного входа
  const handleLogin = async (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    // Загружаем сообщения пользователя
    try {
      const storedMessages = await getUserMessagesFromDatabase(user.id);
      const messages: Message[] = storedMessages.map(msg => ({
        id: msg.id,
        text: msg.text,
        isBot: msg.isBot,
        timestamp: new Date(msg.timestamp)
      }));
      
      // Добавляем приветственное сообщение если нет истории
      if (messages.length === 0) {
        const welcomeMessage: Message = {
          id: '1',
          text: `Привет, ${user.username}! Я Himo — умный ИИ-помощник. Могу решать математические задачи! Стоимость: 10 HimCoins за сообщение до 1000 символов.`,
          isBot: true,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        
        // Сохраняем приветственное сообщение
        await saveMessageToDatabase({
          id: welcomeMessage.id,
          userId: user.id,
          text: welcomeMessage.text,
          isBot: welcomeMessage.isBot,
          timestamp: welcomeMessage.timestamp.toISOString()
        });
      } else {
        setMessages(messages);
      }
      
      // Устанавливаем userData на основе профиля пользователя
      setUserData({
        himCoins: user.himCoins,
        lastDailyBonus: user.lastLogin
      });
      
      // Проверяем ежедневный бонус
      const lastLogin = new Date(user.lastLogin);
      const now = new Date();
      const timeDiff = now.getTime() - lastLogin.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      if (hoursDiff >= 24) {
        setCanClaimDaily(true);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
    }
  };

  // Выход из аккаунта
  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setMessages([]);
    setShowChat(false);
    setUserData({ himCoins: 0, lastDailyBonus: '' });
  };

  // Сохранение данных пользователя
  const saveUserData = async (data: UserData) => {
    setUserData(data);
    
    if (currentUser) {
      const updatedUser: UserProfile = {
        ...currentUser,
        himCoins: data.himCoins,
        lastLogin: new Date().toISOString()
      };
      
      try {
        await updateUserInDatabase(updatedUser);
        setCurrentUser(updatedUser);
      } catch (error) {
        console.error('Ошибка обновления пользователя:', error);
      }
    }
  };

  // Получение ежедневного бонуса
  const claimDailyBonus = async () => {
    const now = new Date().toISOString();
    const newUserData: UserData = {
      himCoins: userData.himCoins + DAILY_BONUS,
      lastDailyBonus: now
    };
    await saveUserData(newUserData);
    setCanClaimDaily(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Функция для вычисления стоимости
  const calculateCost = (text: string): number => {
    const length = text.length;
    return Math.ceil(length / 1000) * 10; // 10 HimCoins за каждые 1000 символов
  };

  // Умная функция ответов Himo
  const getHimoResponse = (userText: string): string => {
    const text = userText.toLowerCase();
    
    // Математические выражения
    const mathPatterns = [
      { pattern: /(\d+)\s*\+\s*(\d+)/, operation: (a: number, b: number) => a + b, symbol: '+' },
      { pattern: /(\d+)\s*-\s*(\d+)/, operation: (a: number, b: number) => a - b, symbol: '-' },
      { pattern: /(\d+)\s*\*\s*(\d+)/, operation: (a: number, b: number) => a * b, symbol: '*' },
      { pattern: /(\d+)\s*\/\s*(\d+)/, operation: (a: number, b: number) => b !== 0 ? a / b : null, symbol: '/' },
      { pattern: /(\d+)\s*\^\s*(\d+)/, operation: (a: number, b: number) => Math.pow(a, b), symbol: '^' }
    ];

    for (const { pattern, operation, symbol } of mathPatterns) {
      const match = text.match(pattern);
      if (match) {
        const a = parseInt(match[1]);
        const b = parseInt(match[2]);
        const result = operation(a, b);
        
        if (result === null) {
          return `Ошибка: Нельзя делить на ноль! 😅`;
        }
        
        return `Вычисляю: ${a} ${symbol} ${b} = ${result} 🤖✨`;
      }
    }

    // Квадратный корень
    const sqrtMatch = text.match(/корень\s+(\d+)|sqrt\s*\(?\s*(\d+)\s*\)?/);
    if (sqrtMatch) {
      const num = parseInt(sqrtMatch[1] || sqrtMatch[2]);
      const result = Math.sqrt(num);
      return `Квадратный корень из ${num} = ${result.toFixed(2)} 🔢`;
    }

    // Проценты
    const percentMatch = text.match(/(\d+)%\s*от\s*(\d+)|(колько|what)\s*(\d+)%\s*от\s*(\d+)/);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1] || percentMatch[4]);
      const number = parseInt(percentMatch[2] || percentMatch[5]);
      const result = (number * percent) / 100;
      return `${percent}% от ${number} = ${result} 📈`;
    }

    // Обычные ответы с проверкой ключевых слов
    if (text.includes('математик') || text.includes('задач')) {
      return 'Отлично! Я люблю математику! Напишите выражение вроде: "15 + 25" или "корень 16" 🧮';
    }
    
    if (text.includes('как дела') || text.includes('привет')) {
      return 'Привет! У меня все отлично! Готов помочь с математикой и любыми вопросами! 😊';
    }

    // Обычные ответы
    const responses = [
      'Интересный вопрос! Давайте разберем это вместе. 🤔',
      'Хорошо! Расскажите побольше о том, что вас интересует. 😌',
      'Я всегда готов помочь! Какой у вас вопрос? ✨',
      'Отличная тема для обсуждения! Могу поделиться своими мыслями. 💡',
      'Понял! Давайте рассмотрим это подробнее. 🔍'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;
    
    const cost = calculateCost(inputValue);
    if (userData.himCoins < cost) {
      alert(`Недостаточно HimCoins! Нужно: ${cost}, у вас: ${userData.himCoins}`);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    
    // Сохраняем сообщение пользователя в базу
    try {
      await saveMessageToDatabase({
        id: userMessage.id,
        userId: currentUser.id,
        text: userMessage.text,
        isBot: userMessage.isBot,
        timestamp: userMessage.timestamp.toISOString(),
        cost
      });
    } catch (error) {
      console.error('Ошибка сохранения сообщения:', error);
    }
    
    // Тратим HimCoins в зависимости от длины
    const newUserData: UserData = {
      ...userData,
      himCoins: userData.himCoins - cost
    };
    await saveUserData(newUserData);

    // Ответ от Himo
    setTimeout(async () => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getHimoResponse(currentInput),
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Сохраняем ответ бота в базу
      try {
        await saveMessageToDatabase({
          id: botMessage.id,
          userId: currentUser.id,
          text: botMessage.text,
          isBot: botMessage.isBot,
          timestamp: botMessage.timestamp.toISOString()
        });
      } catch (error) {
        console.error('Ошибка сохранения ответа бота:', error);
      }
    }, 1500);
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

  // Если пользователь не авторизован, показываем форму входа
  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

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
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">@{currentUser?.username}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Icon name="Coins" size={16} className="mr-1" />
                {userData.himCoins} HimCoins
              </Badge>
              <Button onClick={exportHistory} variant="outline" size="sm">
                <Icon name="Download" size={16} className="mr-2" />
                Экспорт
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <Icon name="LogOut" size={16} className="mr-2" />
                Выйти
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
                      {message.isBot ? '🟣' : '👤'}
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
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || userData.himCoins < calculateCost(inputValue) || !currentUser}
                className="px-6"
              >
                <Icon name="Send" size={16} />
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Напишите сообщение или математическое выражение..."
                disabled={userData.himCoins < 10 || !currentUser}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                Стоимость: {inputValue ? calculateCost(inputValue) : 10} HimCoins
              </div>
              {userData.himCoins < 10 && (
                <p className="text-sm text-destructive">
                  Недостаточно HimCoins!
                </p>
              )}
            </div>
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
            Платформа нового поколения для общения с ИИ. Используйте HimCoins для доступа 
            к продвинутым возможностям искусственного интеллекта.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            {isAuthenticated ? (
              <Button 
                onClick={() => setShowChat(true)}
                size="lg" 
                className="px-8 py-3 text-lg font-medium"
              >
                <Icon name="MessageCircle" size={20} className="mr-2" />
                Начать общение
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Войдите или зарегистрируйтесь для начала общения с Himo
                </p>
                <Button 
                  size="lg" 
                  className="px-8 py-3 text-lg font-medium"
                  disabled
                >
                  <Icon name="Lock" size={20} className="mr-2" />
                  Требуется авторизация
                </Button>
              </div>
            )}
          </div>

          {/* HimCoins Balance Card */}
          {isAuthenticated && (
            <Card className="max-w-sm mx-auto bg-white/80 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Icon name="Coins" size={24} />
                  <span className="font-semibold">Баланс HimCoins</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{userData.himCoins}</div>
                  <p className="text-sm text-gray-600 mb-4">HimCoins доступно</p>
                  
                  {canClaimDaily ? (
                    <Button 
                      onClick={claimDailyBonus}
                      className="mb-2"
                    >
                      <Icon name="Gift" size={16} className="mr-2" />
                      Получить +{DAILY_BONUS} HimCoins
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Icon name="Clock" size={16} className="mr-2" />
                      Ежедневный бонус получен
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
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
              <h3 className="text-xl font-semibold mb-2">HimCoins система</h3>
              <p className="text-gray-600">
                Получайте 200 HimCoins ежедневно и тратьте на общение с ИИ
              </p>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
};

export default Index;