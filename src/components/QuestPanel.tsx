import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { Quest } from '@/components/Auth';

interface QuestPanelProps {
  quests: Quest[];
  onClaimReward: (questId: string) => void;
}

const QuestPanel: React.FC<QuestPanelProps> = ({ quests, onClaimReward }) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Target" size={20} className="text-amber-600" />
          <span>Ежедневные квесты</span>
          <Badge variant="outline" className="ml-auto">
            {quests.filter(q => q.completed).length} / {quests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quests.map((quest) => (
          <div key={quest.id} className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{quest.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{quest.description}</p>
              </div>
              
              {quest.completed ? (
                <Button
                  size="sm"
                  onClick={() => onClaimReward(quest.id)}
                  className="ml-2 bg-green-600 hover:bg-green-700"
                >
                  <Icon name="Gift" size={14} className="mr-1" />
                  Получить
                </Button>
              ) : (
                <Badge variant="outline" className="ml-2 text-xs">
                  {quest.progress}/{quest.target}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={(quest.progress / quest.target) * 100} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">
                    Прогресс: {quest.progress}/{quest.target}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-blue-600">
                    <Icon name="Coins" size={12} />
                    <span>{quest.reward.himCoins}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <Icon name="Star" size={12} />
                    <span>{quest.reward.goldCoins}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {quests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Icon name="Calendar" size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Квесты обновляются каждые 24 часа</p>
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Icon name="RotateCcw" size={14} />
            <span>Квесты обновляются каждый день в 00:00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestPanel;