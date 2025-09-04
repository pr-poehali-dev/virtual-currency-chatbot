import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { 
  getUserFromDatabase, 
  saveUserToDatabase, 
  updateUserInDatabase 
} from '@/utils/database';

interface AuthProps {
  onLogin: (userData: UserProfile) => void;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  reward: {
    himCoins: number;
    goldCoins: number;
  };
}

export interface Subscription {
  type: 'none' | '3days' | '1week' | '1month';
  startDate?: string;
  endDate?: string;
  active: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  himCoins: number;
  goldCoins: number;
  registrationDate: string;
  lastLogin: string;
  totalMessages: number;
  quests: Quest[];
  lastQuestReset: string;
  subscription: Subscription;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Введите имя пользователя';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Минимум 3 символа';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Минимум 6 символов';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Имитация API вызова
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (isLogin) {
        // Вход - ищем пользователя в базе данных
        const existingUser = await getUserFromDB(formData.username);
        if (existingUser) {
          const updatedUser = {
            ...existingUser,
            lastLogin: new Date().toISOString()
          };
          await updateUserInDB(updatedUser);
          onLogin(updatedUser);
        } else {
          setErrors({ username: 'Пользователь не найден' });
        }
      } else {
        // Регистрация - создаем нового пользователя
        const existingUser = await getUserFromDB(formData.username);
        if (existingUser) {
          setErrors({ username: 'Пользователь уже существует' });
        } else {
          const initialQuests: Quest[] = generateDailyQuests();
          
          const newUser: UserProfile = {
            id: crypto.randomUUID(),
            username: formData.username,
            email: formData.email,
            himCoins: 500, // Стартовый бонус для новых пользователей
            goldCoins: 0, // Начинаем с 0 золотых монет
            registrationDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            totalMessages: 0,
            quests: initialQuests,
            lastQuestReset: new Date().toISOString(),
            subscription: {
              type: 'none',
              active: false
            }
          };
          await saveUserToDB(newUser);
          onLogin(newUser);
        }
      }
    } catch (error) {
      setErrors({ general: 'Произошла ошибка. Попробуйте еще раз.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Icon name="Sparkles" size={16} />
            AI Platform
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </h1>
          <p className="text-gray-600">
            {isLogin 
              ? 'Войдите, чтобы продолжить общение с Himo' 
              : 'Создайте аккаунт и получите 500 HimCoins!'}
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <Icon name={isLogin ? 'LogIn' : 'UserPlus'} size={20} />
              {isLogin ? 'Вход' : 'Регистрация'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Введите имя пользователя"
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Введите email"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Введите пароль"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Повторите пароль"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{errors.general}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    {isLogin ? 'Входим...' : 'Регистрируемся...'}
                  </>
                ) : (
                  <>
                    <Icon name={isLogin ? 'LogIn' : 'UserPlus'} size={16} className="mr-2" />
                    {isLogin ? 'Войти' : 'Зарегистрироваться'}
                  </>
                )}
              </Button>
            </form>

            {/* Registration Bonus */}
            {!isLogin && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Icon name="Gift" size={16} />
                  <span className="text-sm font-medium">Бонус за регистрацию:</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-100 text-green-800">
                    <Icon name="Coins" size={12} className="mr-1" />
                    +500 HimCoins
                  </Badge>
                  <span className="text-xs text-green-600">
                    Сразу после создания аккаунта!
                  </span>
                </div>
              </div>
            )}

            {/* Switch Mode */}
            <div className="mt-6 text-center border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">
                {isLogin ? 'Еще нет аккаунта?' : 'Уже есть аккаунт?'}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ username: '', email: '', password: '', confirmPassword: '' });
                  setErrors({});
                }}
                className="w-full"
              >
                <Icon name={isLogin ? 'UserPlus' : 'LogIn'} size={16} className="mr-2" />
                {isLogin ? 'Зарегистрироваться' : 'Войти'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo info */}
        <div className="text-center text-xs text-gray-500 bg-white/50 rounded-lg p-3">
          <Icon name="Info" size={14} className="inline mr-1" />
          Все данные сохраняются локально в вашем браузере
        </div>
      </div>
    </div>
  );
};

// Функции для работы с базой данных
const getUserFromDB = async (username: string): Promise<UserProfile | null> => {
  try {
    return await getUserFromDatabase(username);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    return null;
  }
};

const saveUserToDB = async (user: UserProfile): Promise<void> => {
  try {
    await saveUserToDatabase(user);
  } catch (error) {
    console.error('Ошибка при сохранении пользователя:', error);
    throw error;
  }
};

const updateUserInDB = async (user: UserProfile): Promise<void> => {
  try {
    await updateUserInDatabase(user);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    throw error;
  }
};

// Функция для генерации ежедневных квестов
const generateDailyQuests = (): Quest[] => {
  return [
    {
      id: 'quest1',
      title: 'Активный собеседник',
      description: 'Отправьте 5 сообщений боту',
      target: 5,
      progress: 0,
      completed: false,
      reward: {
        himCoins: 100,
        goldCoins: 1
      }
    },
    {
      id: 'quest2', 
      title: 'Любознательный',
      description: 'Отправьте 15 сообщений боту',
      target: 15,
      progress: 0,
      completed: false,
      reward: {
        himCoins: 100,
        goldCoins: 1
      }
    },
    {
      id: 'quest3',
      title: 'Болтун дня',
      description: 'Отправьте 30 сообщений боту',
      target: 30,
      progress: 0,
      completed: false,
      reward: {
        himCoins: 100,
        goldCoins: 1
      }
    }
  ];
};

export default Auth;
export type { UserProfile };