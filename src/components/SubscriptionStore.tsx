import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Subscription } from '@/components/Auth';

interface SubscriptionPlan {
  id: 'none' | '3days' | '1week' | '1month';
  title: string;
  duration: string;
  price: number;
  benefits: string[];
  popular?: boolean;
}

interface SubscriptionStoreProps {
  currentSubscription: Subscription;
  goldCoins: number;
  onPurchase: (planId: 'none' | '3days' | '1week' | '1month') => void;
  onClose: () => void;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: '3days',
    title: 'Him+ Старт',
    duration: '3 дня',
    price: 10,
    benefits: [
      'Бесконечные сообщения боту',
      'Ежедневный бонус 100 HimCoins',
      'Приоритетная поддержка'
    ]
  },
  {
    id: '1week',
    title: 'Him+ Недельный',
    duration: '7 дней',
    price: 30,
    benefits: [
      'Бесконечные сообщения боту',
      'Ежедневный бонус 100 HimCoins',
      'Приоритетная поддержка',
      'Эксклюзивные возможности'
    ],
    popular: true
  },
  {
    id: '1month',
    title: 'Him+ Месячный',
    duration: '30 дней',
    price: 100,
    benefits: [
      'Бесконечные сообщения боту',
      'Ежедневный бонус 100 HimCoins',
      'Приоритетная поддержка',
      'Эксклюзивные возможности',
      'Дополнительные награды за квесты'
    ]
  }
];

const SubscriptionStore: React.FC<SubscriptionStoreProps> = ({ 
  currentSubscription, 
  goldCoins, 
  onPurchase, 
  onClose 
}) => {
  const formatTimeRemaining = (endDate: string): string => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Истекла';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}д ${hours}ч`;
    return `${hours}ч`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center">
              <Icon name="Crown" size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Магазин Him+</h2>
              <p className="text-sm text-gray-600">Премиум подписка для неограниченного общения</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg">
              <Icon name="Star" size={16} className="text-amber-600" />
              <span className="font-medium text-amber-800">{goldCoins} GoldCoins</span>
            </div>
            <Button variant="ghost" onClick={onClose} size="sm">
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription.active && (
          <div className="mx-6 mt-4">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="CheckCircle" size={20} className="text-green-600" />
                    <div>
                      <h3 className="font-medium text-green-800">Him+ Активна</h3>
                      <p className="text-sm text-green-600">
                        Осталось: {currentSubscription.endDate ? formatTimeRemaining(currentSubscription.endDate) : 'Неограниченно'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Премиум
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Выберите план подписки</h3>
            <p className="text-gray-600 text-sm">
              Получите неограниченные возможности и дополнительные бонусы с Him+
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative border-2 transition-all hover:shadow-lg ${
                  plan.popular 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white px-3 py-1">
                      <Icon name="Star" size={12} className="mr-1" />
                      Популярный
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold flex items-center justify-center gap-2">
                      <Icon name="Star" size={20} className="text-amber-600" />
                      {plan.price}
                    </div>
                    <p className="text-sm text-gray-600">{plan.duration}</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Icon name="Check" size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => onPurchase(plan.id)}
                    disabled={goldCoins < plan.price}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    size="lg"
                  >
                    {goldCoins < plan.price ? (
                      <>
                        <Icon name="Lock" size={16} className="mr-2" />
                        Недостаточно GoldCoins
                      </>
                    ) : (
                      <>
                        <Icon name="Crown" size={16} className="mr-2" />
                        Купить за {plan.price} GoldCoins
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
            <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Icon name="Sparkles" size={20} />
              Преимущества Him+
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="MessageCircle" size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900">Безлимитные сообщения</h5>
                    <p className="text-sm text-blue-700">Общайтесь с Himo без ограничений на HimCoins</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Gift" size={16} className="text-green-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900">Ежедневные бонусы</h5>
                    <p className="text-sm text-blue-700">Получайте дополнительные 100 HimCoins каждый день</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Zap" size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900">Приоритетная обработка</h5>
                    <p className="text-sm text-blue-700">Ваши запросы обрабатываются в первую очередь</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Star" size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900">Эксклюзивные функции</h5>
                    <p className="text-sm text-blue-700">Доступ к уникальным возможностям и обновлениям</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How to get GoldCoins */}
          {goldCoins < 10 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={20} className="text-amber-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-amber-800 mb-1">Как получить GoldCoins?</h5>
                  <p className="text-sm text-amber-700">
                    Выполняйте ежедневные квесты, чтобы заработать GoldCoins. 
                    За каждый выполненный квест вы получаете 1 GoldCoin и 100 HimCoins!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStore;